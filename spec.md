# VaultDrop

## Current State
VaultDrop is a digital downloads marketplace with:
- Admin dashboard: analytics, listings CRUD, orders/refunds, user management (ban/unban), subscription management, review moderation
- User dashboard: browse/purchase listings, order history, downloads, subscription, wishlist (public/private), reviews
- Stripe integration: one-time purchases and monthly subscriptions
- Role system: admin, subscribed, regular
- Reviews & Ratings: verified purchase required, admin moderation (approve/reject/delete)
- Wishlist: public/private toggle, shareable link, dedicated tab in user dashboard

## Requested Changes (Diff)

### Add
1. **Discount Codes system**
   - DiscountCode model: code (unique text), discountPercent (Nat 1-100), expiresAt (optional Timestamp), usageLimit (optional Nat), usageCount (Nat), isActive (Bool), createdAt, updatedAt
   - Backend: createDiscountCode, getDiscountCodes (admin), validateDiscountCode (any user, returns code details if valid), redeemDiscountCode (user, increments usageCount), deactivateDiscountCode (admin)
   - Validation rules: code must be active, not expired, under usage limit
   - Applies to one-time purchases only (not subscriptions)
   - Checkout flow: user enters code before payment, sees discounted price

2. **Notification system**
   - Notification model: id, userId, type (NotificationType), title, message, isRead (Bool), createdAt, relatedEntityId (optional - listingId or orderId)
   - NotificationType variants: #purchaseCompleted, #newListing, #earlyAccessListing, #subscriptionRenewalWarning, #subscriptionExpired, #wishlistPriceDrop, #adminAnnouncement
   - Backend functions:
     - createNotification (internal helper)
     - getCallerNotifications: returns user's notifications sorted newest first
     - markNotificationRead(notificationId): mark single as read
     - markAllNotificationsRead: mark all caller's notifications as read
     - clearNotifications: remove all read notifications for caller
     - sendAdminAnnouncement(title, message): admin-only, creates notifications for ALL users
     - Trigger hooks: call createNotification internally when:
       - Order status changes to #completed → #purchaseCompleted for that user
       - Listing created/updated to #published → #newListing for all regular+subscribed users
       - Listing created/updated to #upcoming → #earlyAccessListing for all subscribed users
       - createSubscription called → track period end, warn 3 days before expiry (#subscriptionRenewalWarning)
       - updateSubscriptionStatus to #expired → #subscriptionExpired for that user
       - Listing price changes (updateListing with new price) → #wishlistPriceDrop for users who have that listing in wishlist
   - getUnreadNotificationCount: fast query for badge count

### Modify
- createOrder: after status set to #pending, also accept discountCodeId param (optional), validate and apply discount, store discountedAmount
- updateOrderStatus: when status → #completed, trigger purchaseCompleted notification for order's user
- createListing / updateListing: trigger #newListing or #earlyAccessListing notifications based on new status; trigger #wishlistPriceDrop if price changed
- Order model: add optional discountCode field (the code used) and discountPercent field

### Remove
- Nothing removed

## Implementation Plan
1. Add DiscountCode type and notifications map + notification type to backend
2. Add DiscountCode CRUD backend functions (create, list, validate, redeem, deactivate)
3. Add Notification CRUD backend functions (get, markRead, markAll, clear, sendAnnouncement)
4. Wire notification triggers into existing order/listing/subscription update functions
5. Add discountCode param to createOrder, validate and apply discount percentage
6. Frontend - Admin: Add "Discount Codes" tab to admin dashboard (create code form, list active/expired codes, deactivate)
7. Frontend - Admin: Add "Announcements" send panel under notifications section or in settings
8. Frontend - User: Add notification bell icon with unread badge in nav, notification dropdown panel (mark read, clear)
9. Frontend - User: Add discount code input field at checkout step with real-time validation and price preview
10. Frontend - Admin: Review moderation panel already exists; no changes needed
