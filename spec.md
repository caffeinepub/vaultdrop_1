# VaultDrop

## Current State

VaultDrop is a digital downloads marketplace with:
- Admin-only listings management (create, edit, delete, with file/preview image uploads)
- Three user roles: admin, subscribed, regular
- Subscribed users get early access to "upcoming" listings
- Stripe checkout for one-time purchases and monthly subscriptions
- Admin dashboard: analytics (KPIs + revenue chart), orders management (refund), users management (ban/unban), subscriptions management, settings (Stripe key)
- User dashboard: browse listings, orders/downloads, subscription status, profile
- Authorization via MixinAuthorization; blob storage via MixinStorage

## Requested Changes (Diff)

### Add

**Reviews & Ratings**
- `Review` data model: id, listingId, userId, rating (1–5), comment, status (pending/approved/rejected), createdAt, updatedAt
- Backend endpoints:
  - `submitReview(listingId, rating, comment)` — caller must have a completed order for the listing; creates review with status=pending
  - `getApprovedReviews(listingId)` — public, returns only approved reviews for a listing
  - `getAllReviews()` — admin only, returns all reviews across all listings
  - `moderateReview(reviewId, status)` — admin only, sets review to approved or rejected
  - `deleteReview(reviewId)` — admin only
- Average star rating computed from approved reviews per listing
- Listing detail page shows approved reviews with star ratings and average
- User dashboard shows which listings the user has reviewed (and can submit a review for purchased listings they haven't reviewed yet)
- Admin dashboard gets a "Reviews" moderation panel: table of pending/all reviews with approve, reject, delete actions

**Wishlist**
- `Wishlist` data model: one per user — userId, listingIds (list), isPublic (bool), updatedAt
- Backend endpoints:
  - `addToWishlist(listingId)` — caller adds listing to their wishlist
  - `removeFromWishlist(listingId)` — caller removes listing from their wishlist
  - `getCallerWishlist()` — returns caller's own wishlist with full listing objects
  - `setWishlistVisibility(isPublic)` — caller toggles public/private
  - `getPublicWishlist(userId)` — returns wishlist if isPublic=true, else error
- User dashboard: dedicated "Wishlist" tab showing saved listings, visibility toggle, shareable link when public
- Listing cards/detail page: heart/bookmark button to add/remove from wishlist

### Modify

- Listing detail page: add reviews section below listing details (average rating, list of approved reviews, submit review form for eligible purchasers)
- User dashboard: add "Wishlist" tab alongside existing Orders/Downloads/Subscription/Profile tabs
- Admin dashboard: add "Reviews" tab in the navigation for moderation panel

### Remove

Nothing removed.

## Implementation Plan

1. Add `Review` type, `Wishlist` type, and review/wishlist storage maps to Motoko backend
2. Implement review endpoints: submitReview (purchase-verified), getApprovedReviews, getAllReviews, moderateReview, deleteReview
3. Implement wishlist endpoints: addToWishlist, removeFromWishlist, getCallerWishlist, setWishlistVisibility, getPublicWishlist
4. Regenerate backend.d.ts to expose new types and methods to frontend
5. Frontend — Listing detail page: add reviews section (average star, review list, submit form gated on verified purchase)
6. Frontend — User dashboard: add Wishlist tab (listing cards with remove button, visibility toggle, shareable link)
7. Frontend — Listing cards and detail page: add wishlist heart/bookmark toggle button
8. Frontend — Admin dashboard: add Reviews tab with moderation table (pending filter, approve/reject/delete actions)
9. Apply deterministic data-ocid markers to all new interactive surfaces
