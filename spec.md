# VaultDrop

## Current State
Full-stack digital marketplace on ICP with:
- Admin dashboard (analytics, listings, orders, users, subscriptions, reviews, discount codes, affiliates, open source projects)
- User dashboard (orders, downloads, wishlist, subscription, affiliate, notifications, profile)
- Stripe checkout for one-time purchases and subscriptions
- Review & rating system with admin moderation
- Wishlist with public/private sharing
- Discount codes (percentage off, one-time purchases)
- In-app notification center
- Open Source Tip Jar
- Affiliate program with referral links
- Purchase receipts (PDF download)
- Account deletion with 30-day grace period
- Secure sign-in pages for users and admin

## Requested Changes (Diff)

### Add
1. **License Key Generator** -- After a purchase is completed, the user receives a unique license key for that product. Keys are auto-generated (UUID-style) per order/listing pair. Displayed in dashboard Downloads tab and in the purchase receipt. Admins can view all license keys per listing.
2. **Social Sharing** -- Every listing detail page gets one-click share buttons for Twitter/X, LinkedIn, and a "Copy Link" button. Shares include the listing title and a link to the listing. A small share toolbar/panel appears on listing cards and detail pages.

### Modify
- `Order` type: add optional `licenseKey` field (generated on order completion)
- Admin Listings panel: add a "License Keys" tab or expandable row showing keys issued per listing
- User Downloads tab: show license key alongside each completed order
- Purchase receipt: include license key if present

### Remove
Nothing removed.

## Implementation Plan

### Backend
- Add `licenseKey : ?Text` field to the `Order` type
- Add a `generateLicenseKey` private function that produces a UUID-like string using timestamp + listing/user hash
- Modify `updateOrderStatus` to auto-generate and store a license key when status transitions to `#completed`
- Add `getUserLicenseKeys() : async [(OrderId, ListingId, Text)]` -- returns all license key info for the caller's completed orders
- Add `adminGetLicenseKeys(listingId: ListingId) : async [(OrderId, UserId, Text)]` -- admin view of keys per listing

### Frontend
- **Social Sharing toolbar** -- A reusable `ShareToolbar` component with Twitter/X, LinkedIn, and Copy Link buttons. Appears on:
  - Listing detail page (below title/price)
  - Listing card (on hover or as a small icon row)
- **License Key display** -- User Dashboard → Downloads tab: each completed order row shows the license key in a monospace badge with a copy button
- **Admin Listings** -- Add a "View Keys" expandable panel per listing showing issued license keys (OrderId, userId, key)
- **Receipt** -- Include license key in the PDF/printable receipt if present
