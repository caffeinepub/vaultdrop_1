import Map "mo:core/Map";
import List "mo:core/List";

module {
  type Timestamp = Int;
  type UserId = Text;
  type ListingId = Text;
  type OrderId = Text;
  type SubscriptionId = Text;
  type ReviewId = Text;

  type AppUserRole = {
    #admin;
    #subscribed;
    #regular;
  };

  type ListingStatus = {
    #draft;
    #upcoming;
    #published;
  };

  type UserProfile = {
    id : UserId;
    username : Text;
    email : Text;
    role : AppUserRole;
    createdAt : Timestamp;
    updatedAt : Timestamp;
    isBanned : Bool;
  };

  type Listing = {
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

  type OrderStatus = {
    #pending;
    #completed;
    #refunded;
  };

  type Order = {
    id : OrderId;
    userId : UserId;
    listingId : ListingId;
    paymentIntentId : ?Text;
    amount : Nat;
    status : OrderStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type SubscriptionStatus = {
    #active;
    #cancelled;
    #expired;
  };

  type Subscription = {
    id : SubscriptionId;
    userId : UserId;
    stripeSubscriptionId : Text;
    status : SubscriptionStatus;
    currentPeriodEnd : Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type ReviewStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type Review = {
    id : ReviewId;
    listingId : ListingId;
    userId : UserId;
    rating : Nat;
    comment : Text;
    status : ReviewStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Wishlist = {
    userId : UserId;
    listingIds : List.List<ListingId>;
    isPublic : Bool;
    updatedAt : Timestamp;
  };

  type WishlistSnapshot = {
    userId : UserId;
    listingIds : [ListingId];
    isPublic : Bool;
    updatedAt : Timestamp;
  };

  type OldActor = {
    users : Map.Map<UserId, UserProfile>;
    listings : Map.Map<ListingId, Listing>;
    orders : Map.Map<OrderId, Order>;
    subscriptions : Map.Map<SubscriptionId, Subscription>;
    reviews : Map.Map<ReviewId, Review>;
    wishlists : Map.Map<UserId, Wishlist>;
    userPurchases : Map.Map<UserId, List.List<ListingId>>;
  };

  type DiscountCode = {
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

  type NotificationType = {
    #purchaseCompleted;
    #newListing;
    #earlyAccessListing;
    #subscriptionRenewalWarning;
    #subscriptionExpired;
    #wishlistPriceDrop;
    #adminAnnouncement;
  };

  type Notification = {
    id : Text;
    userId : UserId;
    notificationType : NotificationType;
    title : Text;
    message : Text;
    isRead : Bool;
    createdAt : Timestamp;
    relatedEntityId : ?Text;
  };

  type NewOrder = {
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

  type NewActor = {
    users : Map.Map<UserId, UserProfile>;
    listings : Map.Map<ListingId, Listing>;
    orders : Map.Map<OrderId, NewOrder>;
    subscriptions : Map.Map<SubscriptionId, Subscription>;
    reviews : Map.Map<ReviewId, Review>;
    wishlists : Map.Map<UserId, Wishlist>;
    discountCodes : Map.Map<Text, DiscountCode>;
    notifications : Map.Map<Text, Notification>;
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<OrderId, Order, NewOrder>(
      func(_id, order) {
        {
          id = order.id;
          userId = order.userId;
          listingId = order.listingId;
          paymentIntentId = order.paymentIntentId;
          amount = order.amount;
          status = order.status;
          createdAt = order.createdAt;
          updatedAt = order.updatedAt;
          usedDiscountCode = null;
          discountPercent = null;
        };
      }
    );

    {
      users = old.users;
      listings = old.listings;
      orders = newOrders;
      subscriptions = old.subscriptions;
      reviews = old.reviews;
      wishlists = old.wishlists;
      discountCodes = Map.empty<Text, DiscountCode>();
      notifications = Map.empty<Text, Notification>();
    };
  };
};
