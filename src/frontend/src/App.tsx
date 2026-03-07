import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import AuthGate from "./components/AuthGate";
import AdminSignInPage from "./pages/AdminSignInPage";
import LandingPage from "./pages/LandingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import ListingsPage from "./pages/ListingsPage";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentSuccess from "./pages/PaymentSuccess";
import SignInPage from "./pages/SignInPage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminDiscountCodes from "./pages/admin/AdminDiscountCodes";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminListings from "./pages/admin/AdminListings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminUsers from "./pages/admin/AdminUsers";
import DashboardDownloads from "./pages/dashboard/DashboardDownloads";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardSubscription from "./pages/dashboard/DashboardSubscription";
import DashboardWishlist from "./pages/dashboard/DashboardWishlist";

// ─── Route tree ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const listingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listings",
  component: ListingsPage,
});

const listingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listings/$listingId",
  component: ListingDetailPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccess,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailure,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInPage,
});

const adminSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/sign-in",
  component: AdminSignInPage,
});

// ─── User Dashboard ───────────────────────────────────────────────────────────

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <AuthGate requireAuth>
      <DashboardLayout />
    </AuthGate>
  ),
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/orders" });
  },
});

const dashboardOrdersRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/orders",
  component: DashboardOrders,
});

const dashboardDownloadsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/downloads",
  component: DashboardDownloads,
});

const dashboardSubscriptionRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/subscription",
  component: DashboardSubscription,
});

const dashboardProfileRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/profile",
  component: DashboardProfile,
});

const dashboardWishlistRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/wishlist",
  component: DashboardWishlist,
});

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AuthGate requireAuth requireAdmin>
      <AdminLayout />
    </AuthGate>
  ),
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/analytics" });
  },
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/analytics",
  component: AdminAnalytics,
});

const adminListingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/listings",
  component: AdminListings,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/orders",
  component: AdminOrders,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/users",
  component: AdminUsers,
});

const adminSubscriptionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/subscriptions",
  component: AdminSubscriptions,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/settings",
  component: AdminSettings,
});

const adminReviewsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/reviews",
  component: AdminReviews,
});

const adminDiscountCodesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/discount-codes",
  component: AdminDiscountCodes,
});

const adminAnnouncementsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/announcements",
  component: AdminAnnouncements,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  listingsRoute,
  listingDetailRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  signInRoute,
  adminSignInRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    dashboardOrdersRoute,
    dashboardDownloadsRoute,
    dashboardSubscriptionRoute,
    dashboardWishlistRoute,
    dashboardProfileRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminAnalyticsRoute,
    adminListingsRoute,
    adminOrdersRoute,
    adminUsersRoute,
    adminSubscriptionsRoute,
    adminReviewsRoute,
    adminDiscountCodesRoute,
    adminAnnouncementsRoute,
    adminSettingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
