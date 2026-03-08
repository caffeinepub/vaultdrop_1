import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";

actor {
  type Timestamp = Int;
  public type UserId = Text;
  public type ListingId = Text;
  public type OrderId = Text;
  public type SubscriptionId = Text;
  public type ReviewId = Text;
  public type WishlistId = Text;
  public type OpenSourceProjectId = Text;
  public type TipId = Text;
  public type Analytics = {
    totalRevenue : Nat;
    monthlyRevenue : Nat;
    totalOrders : Nat;
    activeSubscribers : Nat;
    topListings : [(ListingId, Nat)];
  };

  public type AppUserRole = {
    #admin;
    #subscribed;
    #regular;
  };

  public type ListingStatus = {
    #draft;
    #upcoming;
    #published;
  };

  public type UserProfile = {
    id : UserId;
    username : Text;
    email : Text;
    role : AppUserRole;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    isBanned : Bool;
  };

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

  public type OrderStatus = {
    #pending;
    #completed;
    #refunded;
  };

  public type Order = {
    id : OrderId;
    userId : UserId;
    listingId : ListingId;
    paymentIntentId : ?Text;
    amount : Nat;
    status : OrderStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    usedDiscountCode : ?Text;
    discountPercent : ?Nat;
  };

  public type SubscriptionStatus = {
    #active;
    #cancelled;
    #expired;
  };

  public type Subscription = {
    id : SubscriptionId;
    userId : UserId;
    stripeSubscriptionId : Text;
    status : SubscriptionStatus;
    currentPeriodEnd : Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type ReviewStatus = {
    #pending;
    #approved;
    #rejected;
  };

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

  public type DiscountCode = {
    id : Text;
    code : Text;
    discountPercent : Nat;
    expiresAt : ?Timestamp;
    usageLimit : ?Nat;
    usageCount : Nat;
    isActive : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type NotificationType = {
    #purchaseCompleted;
    #newListing;
    #earlyAccessListing;
    #subscriptionRenewalWarning;
    #subscriptionExpired;
    #wishlistPriceDrop;
    #adminAnnouncement;
  };

  public type Notification = {
    id : Text;
    userId : UserId;
    notificationType : NotificationType;
    title : Text;
    message : Text;
    isRead : Bool;
    createdAt : Timestamp;
    relatedEntityId : ?Text;
  };

  public type OpenSourceProject = {
    id : OpenSourceProjectId;
    title : Text;
    description : Text;
    repoUrl : Text;
    creatorName : Text;
    suggestedTipCents : Nat;
    previewImageKey : ?Text;
    isActive : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type TipStatus = {
    #pending;
    #completed;
  };

  public type Tip = {
    id : TipId;
    projectId : OpenSourceProjectId;
    userId : ?UserId;
    amount : Nat;
    paymentIntentId : ?Text;
    status : TipStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type TipStats = {
    totalTips : Nat;
    tipsByProject : [(OpenSourceProjectId, Nat)];
  };

  var stripeConfig : ?Stripe.StripeConfiguration = null;
  let accessControlState = AccessControl.initState();

  let users = Map.empty<UserId, UserProfile>();
  let listings = Map.empty<ListingId, Listing>();
  let orders = Map.empty<OrderId, Order>();
  let subscriptions = Map.empty<SubscriptionId, Subscription>();
  let reviews = Map.empty<ReviewId, Review>();
  let wishlists = Map.empty<UserId, Wishlist>();
  let discountCodes = Map.empty<Text, DiscountCode>();
  let notifications = Map.empty<Text, Notification>();
  let openSourceProjects = Map.empty<OpenSourceProjectId, OpenSourceProject>();
  let tips = Map.empty<TipId, Tip>();

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

    if (status == #published) {
      for ((userId, user) in users.entries()) {
        if (user.role == #regular or user.role == #subscribed) {
          ignore createNotification(userId, #newListing, "New Listing Available", "A new listing \"" # title # "\" is now available!", ?listingId);
        };
      };
    } else if (status == #upcoming) {
      for ((userId, user) in users.entries()) {
        if (user.role == #subscribed) {
          ignore createNotification(userId, #earlyAccessListing, "Early Access Listing", "Get early access to \"" # title # "\"!", ?listingId);
        };
      };
    };

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

        if (status == #published and existingListing.status != #published) {
          for ((userId, user) in users.entries()) {
            if (user.role == #regular or user.role == #subscribed) {
              ignore createNotification(userId, #newListing, "New Listing Available", "A new listing \"" # title # "\" is now available!", ?listingId);
            };
          };
        } else if (status == #upcoming and existingListing.status != #upcoming) {
          for ((userId, user) in users.entries()) {
            if (user.role == #subscribed) {
              ignore createNotification(userId, #earlyAccessListing, "Early Access Listing", "Get early access to \"" # title # "\"!", ?listingId);
            };
          };
        };

        if (price < existingListing.price) {
          for ((userId, wishlist) in wishlists.entries()) {
            let hasListing = wishlist.listingIds.values().any(func(id) { id == listingId });
            if (hasListing) {
              ignore createNotification(userId, #wishlistPriceDrop, "Price Drop Alert", "The price of \"" # title # "\" has dropped!", ?listingId);
            };
          };
        };

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

  public shared ({ caller }) func createOrder(listingId : ListingId, amount : Nat, paymentIntentId : ?Text, discountCode : ?Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };

    let callerId = caller.toText();

    if (isUserBanned(callerId)) {
      Runtime.trap("Unauthorized: Banned users cannot purchase");
    };

    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        if (listing.status != #published) {
          Runtime.trap("Unauthorized: Only published listings can be purchased");
        };
      };
    };

    var finalAmount = amount;
    var usedDiscountCode : ?Text = null;
    var discountPercent : ?Nat = null;

    switch (discountCode) {
      case (null) {};
      case (?code) {
        switch (validateDiscountCodeInternal(code)) {
          case (null) {
            Runtime.trap("Invalid discount code");
          };
          case (?validCode) {
            switch (validCode.usageLimit) {
              case (null) {};
              case (?limit) {
                if (validCode.usageCount >= limit) {
                  Runtime.trap("Discount code usage limit reached");
                };
              };
            };

            let discount = validCode.discountPercent;
            finalAmount := (finalAmount * (100 - discount)) / 100;
            usedDiscountCode := ?code;
            discountPercent := ?discount;
            
            let updatedCode = { validCode with usageCount = validCode.usageCount + 1; updatedAt = getCurrentTime() };
            discountCodes.add(validCode.id, updatedCode);
          };
        };
      };
    };

    let orderId = listingId.concat(getCurrentTime().toText());
    let order : Order = {
      id = orderId;
      userId = callerId;
      listingId;
      paymentIntentId;
      amount = finalAmount;
      status = #pending;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
      usedDiscountCode;
      discountPercent;
    };
    orders.add(orderId, order);
    order;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let callerId = caller.toText();

        if (not AccessControl.isAdmin(accessControlState, caller) and order.userId != callerId) {
          Runtime.trap("Unauthorized: Can only update your own orders");
        };

        if (status == #refunded and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only admins can refund orders");
        };

        let updatedOrder = { order with status; updatedAt = getCurrentTime() };
        orders.add(orderId, updatedOrder);

        if (status == #completed and order.status != #completed) {
          switch (listings.get(order.listingId)) {
            case (null) {};
            case (?listing) {
              ignore createNotification(order.userId, #purchaseCompleted, "Purchase Completed", "Your purchase of \"" # listing.title # "\" is complete!", ?orderId);
            };
          };
        };
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

  public shared ({ caller }) func createSubscription(stripeSubscriptionId : Text, currentPeriodEnd : Timestamp) : async Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subscriptions");
    };

    let callerId = caller.toText();

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

        if (not AccessControl.isAdmin(accessControlState, caller) and subscription.userId != callerId) {
          Runtime.trap("Unauthorized: Can only update your own subscription");
        };

        let updatedSubscription = { subscription with status; updatedAt = getCurrentTime() };
        subscriptions.add(subscriptionId, updatedSubscription);

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

          if (status == #expired and subscription.status != #expired) {
            ignore createNotification(subscription.userId, #subscriptionExpired, "Subscription Expired", "Your subscription has expired.", ?subscriptionId);
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
            if (AccessControl.isAdmin(accessControlState, caller)) {
              return ?key;
            };

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

  public query ({ caller }) func getAnalytics() : async Analytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

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

    let currentTime = getCurrentTime();
    let thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60 * 1000000000);

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

  public shared ({ caller }) func submitReview(listingId : ListingId, rating : Nat, comment : Text) : async Review {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };

    let callerId = caller.toText();

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

  public query func getPublicWishlist(userId : UserId) : async ?WishlistSnapshot {
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

  // Discount Codes

  public shared ({ caller }) func createDiscountCode(code : Text, discountPercent : Nat, expiresAt : ?Timestamp, usageLimit : ?Nat) : async DiscountCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create discount codes");
    };

    if (discountPercent < 1 or discountPercent > 100) {
      Runtime.trap("Invalid discount percentage");
    };

    let codeId = code.concat(getCurrentTime().toText());
    let discountCode : DiscountCode = {
      id = codeId;
      code;
      discountPercent;
      expiresAt;
      usageLimit;
      usageCount = 0;
      isActive = true;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    discountCodes.add(codeId, discountCode);
    discountCode;
  };

  public shared ({ caller }) func deactivateDiscountCode(codeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate discount codes");
    };

    switch (discountCodes.get(codeId)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?discountCode) {
        let updatedCode = { discountCode with isActive = false; updatedAt = getCurrentTime() };
        discountCodes.add(codeId, updatedCode);
      };
    };
  };

  public query ({ caller }) func getDiscountCodes() : async [DiscountCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view discount codes");
    };
    discountCodes.values().toArray();
  };

  func validateDiscountCodeInternal(code : Text) : ?DiscountCode {
    let allCodes = discountCodes.toArray();
    let codeOpt = allCodes.find(
      func((_, c)) { c.code == code }
    );

    switch (codeOpt) {
      case (null) { null };
      case (?(_, discountCode)) {
        if (not discountCode.isActive) {
          return null;
        };

        switch (discountCode.expiresAt) {
          case (null) { ?discountCode };
          case (?expires) {
            if (expires <= getCurrentTime()) {
              null;
            } else {
              ?discountCode;
            };
          };
        };
      };
    };
  };

  public query func validateDiscountCode(code : Text) : async {
    #ok : DiscountCode;
    #error : Text;
  } {
    switch (validateDiscountCodeInternal(code)) {
      case (?discountCode) { 
        switch (discountCode.usageLimit) {
          case (null) { #ok(discountCode) };
          case (?limit) {
            if (discountCode.usageCount >= limit) {
              #error("Discount code usage limit reached");
            } else {
              #ok(discountCode);
            };
          };
        };
      };
      case (null) { #error("Invalid or expired discount code") };
    };
  };

  // Notification System

  func createNotification(userId : UserId, notificationType : NotificationType, title : Text, message : Text, relatedEntityId : ?Text) : Notification {
    let notificationId = userId.concat(title).concat(getCurrentTime().toText());
    let notification : Notification = {
      id = notificationId;
      userId;
      notificationType;
      title;
      message;
      isRead = false;
      createdAt = getCurrentTime();
      relatedEntityId;
    };

    notifications.add(notificationId, notification);
    notification;
  };

  public shared ({ caller }) func sendAdminAnnouncement(title : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can send announcements");
    };

    for ((userId, _) in users.entries()) {
      ignore createNotification(userId, #adminAnnouncement, title, message, null);
    };
  };

  public query ({ caller }) func getCallerNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access notifications");
    };

    let callerId = caller.toText();
    let userNotifications = notifications.values().toArray().filter(
      func(notification) { notification.userId == callerId }
    );

    userNotifications;
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access notifications");
    };

    let callerId = caller.toText();
    notifications.values().toArray().filter(
      func(notification) { notification.userId == callerId and not notification.isRead }
    ).size();
  };

  public shared ({ caller }) func markNotificationRead(notificationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify notifications");
    };

    let callerId = caller.toText();
    switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) {
        if (notification.userId != callerId) {
          Runtime.trap("Unauthorized: You do not own this notification");
        };

        let updatedNotification = { notification with isRead = true };
        notifications.add(notificationId, updatedNotification);
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify notifications");
    };

    let callerId = caller.toText();
    for ((notificationId, notification) in notifications.entries()) {
      if (notification.userId == callerId and not notification.isRead) {
        let updatedNotification = { notification with isRead = true };
        notifications.add(notificationId, updatedNotification);
      };
    };
  };

  public shared ({ caller }) func clearReadNotifications() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify notifications");
    };

    let callerId = caller.toText();
    for ((notificationId, notification) in notifications.entries()) {
      if (notification.userId == callerId and notification.isRead) {
        notifications.remove(notificationId);
      };
    };
  };

  // ---------------------------------------------
  //    VaultDrop Marketplace - Open Source Project & Tipping
  // ---------------------------------------------

  public shared ({ caller }) func createOpenSourceProject(
    title : Text,
    description : Text,
    repoUrl : Text,
    creatorName : Text,
    suggestedTipCents : Nat,
    previewImageKey : ?Text
  ) : async OpenSourceProject {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create open source projects");
    };

    let projectId = title.concat(getCurrentTime().toText());
    let project : OpenSourceProject = {
      id = projectId;
      title;
      description;
      repoUrl;
      creatorName;
      suggestedTipCents;
      previewImageKey;
      isActive = true;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    openSourceProjects.add(projectId, project);
    project;
  };

  public shared ({ caller }) func updateOpenSourceProject(
    id : OpenSourceProjectId,
    title : Text,
    description : Text,
    repoUrl : Text,
    creatorName : Text,
    suggestedTipCents : Nat,
    previewImageKey : ?Text,
    isActive : Bool
  ) : async OpenSourceProject {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update open source projects");
    };

    switch (openSourceProjects.get(id)) {
      case (null) { Runtime.trap("Open source project not found") };
      case (?existingProject) {
        let updatedProject = {
          id;
          title;
          description;
          repoUrl;
          creatorName;
          suggestedTipCents;
          previewImageKey;
          isActive;
          createdAt = existingProject.createdAt;
          updatedAt = getCurrentTime();
        };
        openSourceProjects.add(id, updatedProject);
        updatedProject;
      };
    };
  };

  public shared ({ caller }) func deleteOpenSourceProject(id : OpenSourceProjectId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete open source projects");
    };
    openSourceProjects.remove(id);
  };

  public query func getOpenSourceProjects() : async [OpenSourceProject] {
    openSourceProjects.values().toArray().filter(
      func(project) { project.isActive }
    );
  };

  public query ({ caller }) func getAllOpenSourceProjects() : async [OpenSourceProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch all open source projects");
    };
    openSourceProjects.values().toArray();
  };

  public shared ({ caller }) func recordTip(
    projectId : OpenSourceProjectId,
    amount : Nat,
    paymentIntentId : ?Text
  ) : async Tip {
    switch (openSourceProjects.get(projectId)) {
      case (null) { Runtime.trap("Open source project not found") };
      case (?project) {
        if (not project.isActive) {
          Runtime.trap("Cannot tip inactive project");
        };
      };
    };

    let userRole = AccessControl.getUserRole(accessControlState, caller);
    let userId : ?UserId = if (userRole == #guest) {
      null
    } else {
      ?caller.toText()
    };

    let tipId = projectId.concat(getCurrentTime().toText());
    let tip : Tip = {
      id = tipId;
      projectId;
      userId;
      amount;
      paymentIntentId;
      status = #pending;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    tips.add(tipId, tip);
    tip;
  };

  public shared ({ caller }) func completeTip(tipId : TipId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can complete tips");
    };

    switch (tips.get(tipId)) {
      case (null) { Runtime.trap("Tip not found") };
      case (?tip) {
        let updatedTip = { tip with status = #completed; updatedAt = getCurrentTime() };
        tips.add(tipId, updatedTip);
      };
    };
  };

  public query ({ caller }) func getProjectTips(projectId : OpenSourceProjectId) : async [Tip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch project tips");
    };

    tips.values().toArray().filter(
      func(tip) { tip.projectId == projectId }
    );
  };

  public query ({ caller }) func getTipStats() : async TipStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch tip stats");
    };

    let totalTips = tips.values().toArray().foldLeft(
      0,
      func(acc, tip) {
        if (tip.status == #completed) {
          acc + tip.amount;
        } else {
          acc;
        };
      },
    );

    let tipsByProject = Map.empty<OpenSourceProjectId, Nat>();
    tips.values().forEach(
      func(tip) {
        if (tip.status == #completed) {
          let currentAmount = switch (tipsByProject.get(tip.projectId)) {
            case (null) { 0 };
            case (?amount) { amount };
          };
          tipsByProject.add(tip.projectId, currentAmount + tip.amount);
        };
      }
    );

    {
      totalTips;
      tipsByProject = tipsByProject.entries().toArray();
    };
  };
};
