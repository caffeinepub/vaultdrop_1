import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  type Timestamp = Int;
  public type UserId = Text;
  public type ListingId = Text;
  public type OrderId = Text;
  public type SubscriptionId = Text;
  public type ReviewId = Text;
  public type WishlistId = Text;

  // User Roles - Custom application roles
  public type AppUserRole = {
    #admin;
    #subscribed;
    #regular;
  };

  // Listing Status
  public type ListingStatus = {
    #draft;
    #upcoming;
    #published;
  };

  module ListingStatus {
    public func compare(a : ListingStatus, b : ListingStatus) : Order.Order {
      switch (a, b) {
        case (#draft, #draft) { #equal };
        case (#draft, _) { #less };
        case (#upcoming, #draft) { #greater };
        case (#upcoming, #upcoming) { #equal };
        case (#upcoming, #published) { #less };
        case (#published, #published) { #equal };
        case (#published, _) { #greater };
      };
    };
  };

  // User Profile
  public type UserProfile = {
    id : UserId;
    username : Text;
    email : Text;
    role : AppUserRole;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    isBanned : Bool;
  };

  // Listing Model
  public type Listing = {
    id : ListingId;
    title : Text;
    description : Text;
    price : Nat;
    status : ListingStatus;
    previewImageKey : ?Text;
    fileKey : ?Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Order Status
  public type OrderStatus = {
    #pending;
    #completed;
    #refunded;
  };

  module OrderStatus {
    public func compare(a : OrderStatus, b : OrderStatus) : Order.Order {
      switch (a, b) {
        case (#pending, #pending) { #equal };
        case (#pending, _) { #less };
        case (#completed, #pending) { #greater };
        case (#completed, #completed) { #equal };
        case (#completed, #refunded) { #less };
        case (#refunded, #refunded) { #equal };
        case (#refunded, _) { #greater };
      };
    };
  };

  // Order Model
  public type Order = {
    id : OrderId;
    userId : UserId;
    listingId : ListingId;
    paymentIntentId : ?Text;
    amount : Nat;
    status : OrderStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Subscription Status
  public type SubscriptionStatus = {
    #active;
    #cancelled;
    #expired;
  };

  module SubscriptionStatus {
    public func compare(a : SubscriptionStatus, b : SubscriptionStatus) : Order.Order {
      switch (a, b) {
        case (#active, #active) { #equal };
        case (#active, _) { #less };
        case (#cancelled, #active) { #greater };
        case (#cancelled, #cancelled) { #equal };
        case (#cancelled, #expired) { #less };
        case (#expired, #expired) { #equal };
        case (#expired, _) { #greater };
      };
    };
  };

  // Subscription Model
  public type Subscription = {
    id : SubscriptionId;
    userId : UserId;
    stripeSubscriptionId : Text;
    status : SubscriptionStatus;
    currentPeriodEnd : Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Analytics Data
  public type Analytics = {
    totalRevenue : Nat;
    monthlyRevenue : Nat;
    totalOrders : Nat;
    activeSubscribers : Nat;
    topListings : [(ListingId, Nat)];
  };

  // Review Status
  public type ReviewStatus = {
    #pending;
    #approved;
    #rejected;
  };

  // Review Model
  public type Review = {
    id : ReviewId;
    listingId : ListingId;
    userId : UserId;
    rating : Nat; // 1-5
    comment : Text;
    status : ReviewStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Wishlist Model
  public type Wishlist = {
    userId : UserId;
    listingIds : List.List<ListingId>;
    isPublic : Bool;
    updatedAt : Timestamp;
  };

  public type WishlistSnapshot = {
    userId : UserId;
    listingIds : [ListingId];
    isPublic : Bool;
    updatedAt : Timestamp;
  };

  // STRIPE INTEGRATION
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  let accessControlState = AccessControl.initState();

  // Persistent Storage
  let users = Map.empty<UserId, UserProfile>();
  let listings = Map.empty<ListingId, Listing>();
  let orders = Map.empty<OrderId, Order>();
  let subscriptions = Map.empty<SubscriptionId, Subscription>();
  let userPurchases = Map.empty<UserId, List.List<ListingId>>();
  let reviews = Map.empty<ReviewId, Review>();
  let wishlists = Map.empty<UserId, Wishlist>();

  // Helpers
  func getCurrentTime() : Timestamp {
    Time.now();
  };

  func getUser(id : UserId) : ?UserProfile {
    users.get(id);
  };

  func getUserOrTrap(id : UserId) : UserProfile {
    switch (users.get(id)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  func isUserBanned(userId : UserId) : Bool {
    switch (users.get(userId)) {
      case (null) { false };
      case (?user) { user.isBanned };
    };
  };

  func getAppUserRole(userId : UserId) : AppUserRole {
    switch (users.get(userId)) {
      case (null) { #regular };
      case (?user) { user.role };
    };
  };

  func isAppAdmin(userId : UserId) : Bool {
    switch (users.get(userId)) {
      case (null) { false };
      case (?user) { user.role == #admin };
    };
  };

  // Authentication and Save Profile
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public shared ({ caller }) func saveCallerUserProfile(username : Text, email : Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let callerId = caller.toText();
    let existingUser = users.get(callerId);

    let userProfile : UserProfile = switch (existingUser) {
      case (null) {
        {
          id = callerId;
          username;
          email;
          role = #regular;
          createdAt = getCurrentTime();
          updatedAt = getCurrentTime();
          isBanned = false;
        };
      };
      case (?existing) {
        {
          id = callerId;
          username;
          email;
          role = existing.role;
          createdAt = existing.createdAt;
          updatedAt = getCurrentTime();
          isBanned = existing.isBanned;
        };
      };
    };

    users.add(callerId, userProfile);
    userProfile;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    let userId = user.toText();
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(userId);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    users.get(caller.toText());
  };

  // User Management
  public shared ({ caller }) func banUser(userId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let user = getUserOrTrap(userId);
    let updatedUser = { user with isBanned = true; updatedAt = getCurrentTime() };
    users.add(userId, updatedUser);
  };

  public shared ({ caller }) func unbanUser(userId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let user = getUserOrTrap(userId);
    let updatedUser = { user with isBanned = false; updatedAt = getCurrentTime() };
    users.add(userId, updatedUser);
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    users.values().toArray();
  };

  // Listings Management
  public shared ({ caller }) func createListing(title : Text, description : Text, price : Nat, status : ListingStatus, previewImageKey : ?Text, fileKey : ?Text) : async Listing {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let listingId = title.concat(getCurrentTime().toText());
    let listing : Listing = {
      id = listingId;
      title;
      description;
      price;
      status;
      previewImageKey;
      fileKey;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    listings.add(listingId, listing);
    listing;
  };

  public shared ({ caller }) func updateListing(listingId : ListingId, title : Text, description : Text, price : Nat, status : ListingStatus, previewImageKey : ?Text, fileKey : ?Text) : async Listing {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?existingListing) {
        let updatedListing : Listing = {
          id = listingId;
          title;
          description;
          price;
          status;
          previewImageKey;
          fileKey;
          createdAt = existingListing.createdAt;
          updatedAt = getCurrentTime();
        };

        listings.add(listingId, updatedListing);
        updatedListing;
      };
    };
  };

  public shared ({ caller }) func deleteListing(listingId : ListingId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    listings.remove(listingId);
  };

  public query ({ caller }) func getListings() : async [Listing] {
    let callerId = caller.toText();
    let userRole = getAppUserRole(callerId);

    listings.values().toArray().filter(
      func(listing : Listing) : Bool {
        switch (userRole) {
          case (#admin) { true };
          case (#subscribed) {
            listing.status == #published or listing.status == #upcoming
          };
          case (#regular) { listing.status == #published };
        };
      }
    );
  };

  // Orders Management
  public shared ({ caller }) func createOrder(listingId : ListingId, amount : Nat, paymentIntentId : ?Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };

    let callerId = caller.toText();

    // Check if user is banned
    if (isUserBanned(callerId)) {
      Runtime.trap("Unauthorized: Banned users cannot purchase");
    };

    // Verify listing exists
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        // Verify listing is published (only published listings can be purchased)
        if (listing.status != #published) {
          Runtime.trap("Unauthorized: Only published listings can be purchased");
        };
      };
    };

    let orderId = listingId.concat(getCurrentTime().toText());
    let order : Order = {
      id = orderId;
      userId = callerId;
      listingId;
      paymentIntentId;
      amount;
      status = #pending;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };
    orders.add(orderId, order);
    order;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let callerId = caller.toText();

        // Only admin or order owner can update order status
        // Admin can mark as refunded, owner can update their own orders
        if (not AccessControl.isAdmin(accessControlState, caller) and order.userId != callerId) {
          Runtime.trap("Unauthorized: Can only update your own orders");
        };

        // Only admins can mark orders as refunded
        if (status == #refunded and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only admins can refund orders");
        };

        let updatedOrder = { order with status; updatedAt = getCurrentTime() };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getUserOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    let callerId = caller.toText();
    orders.values().toArray().filter(
      func(order : Order) : Bool {
        order.userId == callerId;
      }
    );
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func markOrderAsRefunded(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status = #refunded; updatedAt = getCurrentTime() };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Subscription Management
  public shared ({ caller }) func createSubscription(stripeSubscriptionId : Text, currentPeriodEnd : Timestamp) : async Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subscriptions");
    };

    let callerId = caller.toText();

    // Check if user is banned
    if (isUserBanned(callerId)) {
      Runtime.trap("Unauthorized: Banned users cannot subscribe");
    };

    let subscriptionId = callerId.concat(getCurrentTime().toText());
    let subscription : Subscription = {
      id = subscriptionId;
      userId = callerId;
      stripeSubscriptionId;
      status = #active;
      currentPeriodEnd;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    subscriptions.add(subscriptionId, subscription);

    // Upgrade user role to subscribed
    switch (users.get(callerId)) {
      case (null) { };
      case (?user) {
        let updatedUser = { user with role = #subscribed; updatedAt = getCurrentTime() };
        users.add(callerId, updatedUser);
      };
    };

    subscription;
  };

  public shared ({ caller }) func updateSubscriptionStatus(subscriptionId : SubscriptionId, status : SubscriptionStatus) : async () {
    switch (subscriptions.get(subscriptionId)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?subscription) {
        let callerId = caller.toText();

        // Only admin or subscription owner can update
        if (not AccessControl.isAdmin(accessControlState, caller) and subscription.userId != callerId) {
          Runtime.trap("Unauthorized: Can only update your own subscription");
        };

        let updatedSubscription = { subscription with status; updatedAt = getCurrentTime() };
        subscriptions.add(subscriptionId, updatedSubscription);

        // If subscription is cancelled or expired, downgrade user role to regular
        if (status == #cancelled or status == #expired) {
          switch (users.get(subscription.userId)) {
            case (null) { };
            case (?user) {
              if (user.role == #subscribed) {
                let updatedUser = { user with role = #regular; updatedAt = getCurrentTime() };
                users.add(subscription.userId, updatedUser);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllSubscriptions() : async [Subscription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    subscriptions.values().toArray();
  };

  public query ({ caller }) func getUserSubscriptions() : async [Subscription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };

    let callerId = caller.toText();
    subscriptions.values().toArray().filter(
      func(sub : Subscription) : Bool {
        sub.userId == callerId;
      }
    );
  };

  // Download Access
  public query ({ caller }) func getDownloadFileUrl(listingId : ListingId) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can download files");
    };

    let callerId = caller.toText();

    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        switch (listing.fileKey) {
          case (null) { Runtime.trap("File not found") };
          case (?key) {
            // Admins can always download
            if (AccessControl.isAdmin(accessControlState, caller)) {
              return ?key;
            };

            // Check if user has a completed order for this listing
            let userCompletedOrders = orders.values().toArray().filter(
              func(order : Order) : Bool {
                order.listingId == listingId and
                order.userId == callerId and
                order.status == #completed
              }
            );

            if (userCompletedOrders.size() == 0) {
              Runtime.trap("Unauthorized: Must have a completed order to download");
            };

            ?key;
          };
        };
      };
    };
  };

  // Analytics
  public query ({ caller }) func getAnalytics() : async Analytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    // Compute top selling listings
    let salesCount = Map.empty<ListingId, Nat>();
    let revenueCount = Map.empty<ListingId, Nat>();

    orders.values().forEach(
      func(order : Order) {
        if (order.status == #completed) {
          let currentSales = switch (salesCount.get(order.listingId)) {
            case (null) { 0 };
            case (?count) { count };
          };
          salesCount.add(order.listingId, currentSales + 1);

          let currentRevenue = switch (revenueCount.get(order.listingId)) {
            case (null) { 0 };
            case (?revenue) { revenue };
          };
          revenueCount.add(order.listingId, currentRevenue + order.amount);
        };
      }
    );

    let topListings = salesCount.entries().toArray();

    // Compute other analytics data
    let totalRevenue = orders.values().toArray().foldLeft(
      0,
      func(acc : Nat, order : Order) : Nat {
        if (order.status == #completed) {
          acc + order.amount;
        } else {
          acc;
        };
      },
    );

    // Compute monthly revenue (current month)
    let currentTime = getCurrentTime();
    let thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60 * 1000000000); // 30 days in nanoseconds

    let monthlyRevenue = orders.values().toArray().foldLeft(
      0,
      func(acc : Nat, order : Order) : Nat {
        if (order.status == #completed and order.createdAt >= thirtyDaysAgo) {
          acc + order.amount;
        } else {
          acc;
        };
      },
    );

    let totalOrders = orders.size();

    let activeSubscribers = subscriptions.values().toArray().filter(
      func(sub : Subscription) : Bool { sub.status == #active }
    ).size();

    {
      totalRevenue;
      monthlyRevenue;
      totalOrders;
      activeSubscribers;
      topListings;
    };
  };

  // Stripe Integration
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  /////////////////////
  //// NEW FEATURES ////
  /////////////////////

  // Reviews & Ratings
  public shared ({ caller }) func submitReview(listingId : ListingId, rating : Nat, comment : Text) : async Review {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };

    let callerId = caller.toText();

    // Check if user has completed order for this listing
    let userCompletedOrders = orders.values().toArray().filter(
      func(order : Order) : Bool {
        order.listingId == listingId and
        order.userId == callerId and
        order.status == #completed
      }
    );

    if (userCompletedOrders.size() == 0) {
      Runtime.trap("Unauthorized: Must have a completed order to submit a review");
    };

    // Prevent multiple reviews per user/listing
    let existingReview = reviews.values().toArray().find(
      func(review) {
        review.listingId == listingId and review.userId == callerId
      }
    );

    if (existingReview != null) {
      Runtime.trap("You have already submitted a review for this listing");
    };

    let reviewId = listingId.concat(callerId).concat(getCurrentTime().toText());
    let review : Review = {
      id = reviewId;
      listingId;
      userId = callerId;
      rating;
      comment;
      status = #pending;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    reviews.add(reviewId, review);
    review;
  };

  public query func getApprovedReviews(listingId : ListingId) : async [Review] {
    reviews.values().toArray().filter(
      func(review) {
        review.listingId == listingId and review.status == #approved
      }
    );
  };

  public query ({ caller }) func getAllReviews() : async [Review] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch this data");
    };
    reviews.values().toArray();
  };

  public shared ({ caller }) func moderateReview(reviewId : ReviewId, status : ReviewStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (reviews.get(reviewId)) {
      case (null) { Runtime.trap("Review not found") };
      case (?review) {
        let updatedReview = { review with status; updatedAt = getCurrentTime() };
        reviews.add(reviewId, updatedReview);
      };
    };
  };

  public shared ({ caller }) func deleteReview(reviewId : ReviewId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    reviews.remove(reviewId);
  };

  // Wishlist Management
  func toWishlistSnapshot(wishlist : Wishlist) : WishlistSnapshot {
    {
      userId = wishlist.userId;
      listingIds = wishlist.listingIds.toArray();
      isPublic = wishlist.isPublic;
      updatedAt = wishlist.updatedAt;
    };
  };

  public shared ({ caller }) func addToWishlist(listingId : ListingId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify wishlist");
    };

    // Validate listing exists
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (_) {};
    };

    let callerId = caller.toText();
    let currentTime = getCurrentTime();

    let wishlist = switch (wishlists.get(callerId)) {
      case (null) {
        {
          userId = callerId;
          listingIds = List.empty<ListingId>();
          isPublic = false;
          updatedAt = currentTime;
        };
      };
      case (?existing) { existing };
    };

    let containsListing = wishlist.listingIds.values().any(
      func(id) { id == listingId }
    );

    if (containsListing) {
      Runtime.trap("Listing already in wishlist");
    };

    wishlist.listingIds.add(listingId);
    let updatedWishlist = {
      wishlist with
      listingIds = wishlist.listingIds;
      updatedAt = currentTime;
    };
    wishlists.add(callerId, updatedWishlist);
  };

  public shared ({ caller }) func removeFromWishlist(listingId : ListingId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify wishlist");
    };

    let callerId = caller.toText();

    switch (wishlists.get(callerId)) {
      case (null) { Runtime.trap("Wishlist not found") };
      case (?wishlist) {
        let containsListing = wishlist.listingIds.values().any(
          func(id) { id == listingId }
        );

        if (not containsListing) {
          Runtime.trap("Listing not found in wishlist");
        };

        let filteredList = wishlist.listingIds.filter(
          func(id) { id != listingId }
        );

        let updatedWishlist = {
          wishlist with
          listingIds = filteredList;
          updatedAt = getCurrentTime();
        };
        wishlists.add(callerId, updatedWishlist);
      };
    };
  };

  public query ({ caller }) func getCallerWishlist() : async ?WishlistSnapshot {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access wishlists");
    };
    switch (wishlists.get(caller.toText())) {
      case (null) { null };
      case (?wishlist) { ?toWishlistSnapshot(wishlist) };
    };
  };

  public shared ({ caller }) func setWishlistVisibility(isPublic : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify wishlist");
    };

    let callerId = caller.toText();

    switch (wishlists.get(callerId)) {
      case (null) { Runtime.trap("Wishlist not found") };
      case (?wishlist) {
        let updatedWishlist = {
          wishlist with
          isPublic;
          updatedAt = getCurrentTime();
        };
        wishlists.add(callerId, updatedWishlist);
      };
    };
  };

  public query ({ caller }) func getPublicWishlist(userId : UserId) : async ?WishlistSnapshot {
    switch (wishlists.get(userId)) {
      case (null) { Runtime.trap("Wishlist not found") };
      case (?wishlist) {
        if (not wishlist.isPublic) {
          Runtime.trap("Wishlist is private");
        };
        ?toWishlistSnapshot(wishlist);
      };
    };
  };
};

