# VaultDrop

## Current State

VaultDrop is a digital marketplace with:
- Public storefront: landing page, listings browse page, listing detail page with Stripe checkout, discount codes, reviews
- User dashboard: Orders, Downloads, Subscription, Wishlist, Profile (with account deletion grace period)
- Admin dashboard: Analytics, Listings CRUD, Orders, Users (ban/unban), Subscriptions, Reviews moderation, Discount Codes, Announcements, Settings
- Notification center (bell icon in user dashboard sidebar)
- Sign-in pages for user and admin
- AuthGate for protected routes

Missing/incomplete areas identified during audit:
1. PaymentFailure page has no back/return button
2. ListingsPage missing a back-to-home button from the page header area
3. DashboardDownloads page not reviewed — likely missing a "Browse Store" CTA when empty
4. DashboardWishlist and DashboardSubscription pages not verified for completeness
5. Admin pages lack page-level breadcrumb or back navigation context
6. No Open Source Tip Jar feature exists
7. Admin dashboard missing a "Pending Deletions" panel to view accounts scheduled for deletion
8. LandingPage hero does not have a "Browse listings" back-path CTA that works for both authenticated/unauthenticated
9. No dedicated Open Source projects listing page/section

## Requested Changes (Diff)

### Add

- **Open Source Tip Jar**: A new public page `/open-source` accessible from the main Navbar and Footer. Shows a grid of open-source projects. Each project card displays: project name, description, repo link, and a "Sponsor / Tip" button that initiates a one-time Stripe checkout donation. Admins can create/edit/delete open-source project listings from a new `/admin/open-source` panel.
- **Backend: OpenSourceProject type** with fields: id, title, description, repoUrl, tipAmountCents (suggested tip, user can also custom tip), previewImageKey, creatorName, isActive, createdAt, updatedAt
- **Backend: CRUD for open-source projects** (admin only for create/update/delete; public read)
- **Backend: Tip/donation checkout** via existing Stripe createCheckoutSession, recording tips as a new `Tip` order type (separate from regular orders)
- **Missing back button on PaymentFailure page** — add a "Try Again" and "Back to Listings" button
- **DashboardDownloads empty state CTA** — add "Browse Store" button if confirmed missing
- **Admin: Pending Deletions panel** — new tab in Admin Users page showing users with pending deletions and their scheduled deletion dates
- **Open Source nav link** — add to main Navbar and Footer

### Modify

- **Navbar**: Add "Open Source" link between listings and sign-in
- **Footer**: Add "Open Source" link in the appropriate section
- **AdminLayout sidebar**: Add "Open Source" nav item linking to `/admin/open-source`
- **App.tsx**: Register new routes: `/open-source` and `/admin/open-source`
- **AdminUsers**: Add a "Pending Deletions" tab showing users in grace-period deletion state
- **PaymentFailure page**: Add "Back to Listings" and "Try Again" buttons
- **DashboardWishlist**: Ensure empty state has a "Browse Store" CTA
- **DashboardDownloads**: Ensure empty state has a "Browse Store" CTA
- **DashboardSubscription**: Ensure "Subscribe" CTA is functional and visible

### Remove

Nothing removed.

## Implementation Plan

1. **Backend**: Add `OpenSourceProject` and `Tip` types. Add CRUD functions: `createOpenSourceProject`, `updateOpenSourceProject`, `deleteOpenSourceProject`, `getOpenSourceProjects` (public), `submitTip` (creates a Stripe checkout for a tip amount). 

2. **Frontend - New pages**:
   - `OpenSourcePage.tsx` at `/open-source`: Public page with project grid, sponsor/tip button per card triggering Stripe checkout
   - `AdminOpenSource.tsx` at `/admin/open-source`: Admin CRUD for open-source projects (create, edit, delete)

3. **Frontend - Route additions**: Register the two new routes in `App.tsx`

4. **Frontend - Navigation updates**: Add "Open Source" to Navbar, Footer, and AdminLayout sidebar

5. **Frontend - UI fixes**:
   - PaymentFailure: add back/retry navigation buttons
   - DashboardDownloads: verify and add empty state CTA
   - DashboardWishlist: verify and add empty state CTA
   - AdminUsers: add Pending Deletions tab

6. All new components use consistent existing design tokens (admin gold theme for admin pages, emerald theme for user-facing)
