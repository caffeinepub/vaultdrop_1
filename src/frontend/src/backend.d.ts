import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Subscription {
    id: SubscriptionId;
    status: SubscriptionStatus;
    stripeSubscriptionId: string;
    userId: UserId;
    createdAt: Timestamp;
    currentPeriodEnd: Timestamp;
    updatedAt: Timestamp;
}
export type SubscriptionId = string;
export type ListingId = string;
export interface Analytics {
    totalOrders: bigint;
    topListings: Array<[ListingId, bigint]>;
    activeSubscribers: bigint;
    totalRevenue: bigint;
    monthlyRevenue: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type ReviewId = string;
export interface Review {
    id: ReviewId;
    status: ReviewStatus;
    listingId: ListingId;
    userId: UserId;
    createdAt: Timestamp;
    comment: string;
    updatedAt: Timestamp;
    rating: bigint;
}
export interface Listing {
    id: ListingId;
    status: ListingStatus;
    title: string;
    createdAt: Timestamp;
    description: string;
    updatedAt: Timestamp;
    price: bigint;
    previewImageKey?: string;
    fileKey?: string;
}
export interface WishlistSnapshot {
    userId: UserId;
    updatedAt: Timestamp;
    isPublic: boolean;
    listingIds: Array<ListingId>;
}
export interface Order {
    id: OrderId;
    status: OrderStatus;
    listingId: ListingId;
    userId: UserId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    amount: bigint;
    paymentIntentId?: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type UserId = string;
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type OrderId = string;
export interface UserProfile {
    id: UserId;
    username: string;
    createdAt: Timestamp;
    role: AppUserRole;
    email: string;
    updatedAt: Timestamp;
    isBanned: boolean;
}
export enum AppUserRole {
    admin = "admin",
    regular = "regular",
    subscribed = "subscribed"
}
export enum ListingStatus {
    upcoming = "upcoming",
    published = "published",
    draft = "draft"
}
export enum OrderStatus {
    pending = "pending",
    completed = "completed",
    refunded = "refunded"
}
export enum ReviewStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    expired = "expired"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToWishlist(listingId: ListingId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(userId: UserId): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createListing(title: string, description: string, price: bigint, status: ListingStatus, previewImageKey: string | null, fileKey: string | null): Promise<Listing>;
    createOrder(listingId: ListingId, amount: bigint, paymentIntentId: string | null): Promise<Order>;
    createSubscription(stripeSubscriptionId: string, currentPeriodEnd: Timestamp): Promise<Subscription>;
    deleteListing(listingId: ListingId): Promise<void>;
    deleteReview(reviewId: ReviewId): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllReviews(): Promise<Array<Review>>;
    getAllSubscriptions(): Promise<Array<Subscription>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAnalytics(): Promise<Analytics>;
    getApprovedReviews(listingId: ListingId): Promise<Array<Review>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerWishlist(): Promise<WishlistSnapshot | null>;
    getDownloadFileUrl(listingId: ListingId): Promise<string | null>;
    getListings(): Promise<Array<Listing>>;
    getPublicWishlist(userId: UserId): Promise<WishlistSnapshot | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubscriptions(): Promise<Array<Subscription>>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markOrderAsRefunded(orderId: OrderId): Promise<void>;
    moderateReview(reviewId: ReviewId, status: ReviewStatus): Promise<void>;
    removeFromWishlist(listingId: ListingId): Promise<void>;
    saveCallerUserProfile(username: string, email: string): Promise<UserProfile>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setWishlistVisibility(isPublic: boolean): Promise<void>;
    submitReview(listingId: ListingId, rating: bigint, comment: string): Promise<Review>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unbanUser(userId: UserId): Promise<void>;
    updateListing(listingId: ListingId, title: string, description: string, price: bigint, status: ListingStatus, previewImageKey: string | null, fileKey: string | null): Promise<Listing>;
    updateOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
    updateSubscriptionStatus(subscriptionId: SubscriptionId, status: SubscriptionStatus): Promise<void>;
}
