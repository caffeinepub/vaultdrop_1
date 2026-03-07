# VaultDrop

## Current State
- Authentication uses Internet Identity (ICP-native, cryptographic keypair auth)
- Sign-in is a single button in the Navbar; clicking it opens the II popup window
- AuthGate component guards `/dashboard` and `/admin` routes -- unauthenticated users are silently redirected to `/`
- ProfileSetupModal is shown inline after first login (full-screen overlay)
- No dedicated sign-in page exists; no visual cue about what Internet Identity is
- Admin panel has no visual distinction on the auth guard flow
- No "sign in required" interstitial -- protected routes just redirect without explanation
- Session expiry is handled silently (idle detection disabled)

## Requested Changes (Diff)

### Add
- Dedicated `/sign-in` route with a full-page sign-in UI explaining Internet Identity, showing VaultDrop branding, and a clear "Sign In with Internet Identity" primary CTA
- Separate `/admin/sign-in` route (or parameter) with an admin-specific sign-in wall -- distinct amber/gold admin branding, "Admin Access Only" messaging
- "Sign in required" interstitial screen shown by AuthGate instead of silent redirect -- explains why sign-in is needed (user dashboard access or admin panel access) with a button to go to sign-in
- Security trust indicators on sign-in screens: ICP/II badge, "No password stored", "Cryptographic identity" callout
- Session status indicator in the Navbar: show a subtle "Session active" / lock icon badge on the authenticated avatar
- Sign-out confirmation dialog (AlertDialog) to prevent accidental logout

### Modify
- AuthGate: instead of `navigate({ to: "/" })` on unauthenticated access, render an inline "Access Required" screen with sign-in CTA specific to context (user vs admin)
- Navbar Sign In button: link to `/sign-in` instead of calling `login()` directly -- or show a sign-in sheet/dialog with the II explanation before opening the popup
- ProfileSetupModal: add email format validation and username length validation (3-20 chars, alphanumeric + underscore) with inline error messages

### Remove
- Silent redirect behavior (navigate to `/` without any message when hitting a protected route unauthenticated)

## Implementation Plan
1. Create `SignInPage.tsx` at `/sign-in` -- VaultDrop-branded full-page with II explanation, security badges, and "Sign In with Internet Identity" button
2. Create `AdminSignInPage.tsx` at `/admin/sign-in` -- admin-themed (amber) version of sign-in page
3. Update `AuthGate.tsx` -- replace silent redirect with an inline "Access Required" interstitial component that shows context-specific messaging and a sign-in button
4. Update `Navbar.tsx` -- Sign In button navigates to `/sign-in`; add sign-out confirmation AlertDialog; add subtle session indicator on authenticated avatar
5. Update `ProfileSetupModal.tsx` -- add client-side validation for username (3-20 chars, alphanumeric/underscore) and email format with inline error states
6. Add routes for `/sign-in` and `/admin/sign-in` in `App.tsx`
