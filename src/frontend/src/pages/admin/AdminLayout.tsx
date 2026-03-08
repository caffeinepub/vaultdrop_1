import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  Github,
  Link2,
  LogOut,
  Megaphone,
  MessageSquareDot,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
  Vault,
} from "lucide-react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../../hooks/useQueries";

const navSections = [
  {
    label: "Overview",
    items: [{ path: "/admin/analytics", icon: BarChart3, label: "Analytics" }],
  },
  {
    label: "Marketplace",
    items: [
      { path: "/admin/listings", icon: Package, label: "Listings" },
      { path: "/admin/open-source", icon: Github, label: "Open Source" },
      { path: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    ],
  },
  {
    label: "Community",
    items: [
      { path: "/admin/users", icon: Users, label: "Users" },
      { path: "/admin/subscriptions", icon: Star, label: "Subscriptions" },
      { path: "/admin/reviews", icon: MessageSquareDot, label: "Reviews" },
      { path: "/admin/affiliates", icon: Link2, label: "Affiliates" },
    ],
  },
  {
    label: "Tools",
    items: [
      { path: "/admin/discount-codes", icon: Tag, label: "Discount Codes" },
      { path: "/admin/announcements", icon: Megaphone, label: "Announcements" },
      { path: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "oklch(0.1 0.008 50)" }}
    >
      {/* ─── Admin Sidebar ─────────────────────────────────────── */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r"
        style={{
          background: "oklch(0.1 0.008 50)",
          borderColor: "oklch(0.22 0.015 50)",
        }}
      >
        {/* Brand */}
        <div
          className="p-5 border-b"
          style={{ borderColor: "oklch(0.22 0.015 50)" }}
        >
          <Link to="/" className="flex items-center gap-2 group mb-3">
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: "oklch(0.78 0.19 65 / 0.15)",
                border: "1px solid oklch(0.78 0.19 65 / 0.3)",
              }}
            >
              <Vault
                className="h-4 w-4"
                style={{ color: "oklch(0.78 0.19 65)" }}
              />
            </div>
            <span
              className="font-display font-black text-base"
              style={{ color: "oklch(0.9 0.01 50)" }}
            >
              Vault<span style={{ color: "oklch(0.78 0.19 65)" }}>Drop</span>
            </span>
          </Link>

          {/* Admin badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md w-fit"
            style={{
              background: "oklch(0.78 0.19 65 / 0.1)",
              border: "1px solid oklch(0.78 0.19 65 / 0.25)",
            }}
          >
            <Shield
              className="h-3 w-3"
              style={{ color: "oklch(0.78 0.19 65)" }}
            />
            <span
              className="text-xs font-display font-bold uppercase tracking-wider"
              style={{ color: "oklch(0.78 0.19 65)" }}
            >
              Admin Panel
            </span>
          </div>
        </div>

        {/* User info */}
        <div
          className="p-4 border-b"
          style={{ borderColor: "oklch(0.22 0.015 50)" }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-sm font-display font-bold"
                style={{
                  background: "oklch(0.78 0.19 65 / 0.15)",
                  color: "oklch(0.78 0.19 65)",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p
                className="font-display font-bold text-sm truncate"
                style={{ color: "oklch(0.9 0.01 50)" }}
              >
                {userProfile?.username ?? "Administrator"}
              </p>
              <p
                className="text-xs font-body truncate"
                style={{ color: "oklch(0.55 0.02 50)" }}
              >
                {userProfile?.email ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p
                className="px-3 pb-1.5 text-[10px] font-display font-black uppercase tracking-[0.12em]"
                style={{ color: "oklch(0.38 0.012 50)" }}
              >
                {section.label}
              </p>
              <div className="space-y-px">
                {section.items.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-body font-medium transition-all duration-150"
                      style={
                        isActive
                          ? {
                              background: "oklch(0.78 0.19 65 / 0.1)",
                              color: "oklch(0.9 0.02 65)",
                            }
                          : {
                              color: "oklch(0.62 0.018 50)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "oklch(0.78 0.19 65 / 0.05)";
                          e.currentTarget.style.color = "oklch(0.78 0.01 50)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "oklch(0.62 0.018 50)";
                        }
                      }}
                    >
                      {/* Active left accent bar */}
                      {isActive && (
                        <span
                          className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full"
                          style={{ background: "oklch(0.78 0.19 65)" }}
                        />
                      )}
                      <item.icon
                        className="h-[15px] w-[15px] shrink-0"
                        style={{
                          color: isActive
                            ? "oklch(0.78 0.19 65)"
                            : "oklch(0.42 0.013 50)",
                        }}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight
                          className="h-3 w-3 shrink-0"
                          style={{ color: "oklch(0.78 0.19 65 / 0.6)" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <Separator style={{ background: "oklch(0.22 0.015 50)" }} />

          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-body font-medium transition-all duration-150"
            style={{ color: "oklch(0.5 0.015 50)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(0.65 0.15 200 / 0.06)";
              e.currentTarget.style.color = "oklch(0.65 0.15 200)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "oklch(0.5 0.015 50)";
            }}
          >
            <Store
              className="h-[15px] w-[15px] shrink-0"
              style={{ color: "oklch(0.42 0.013 50)" }}
            />
            View Storefront
          </Link>
        </nav>

        {/* Logout */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "oklch(0.22 0.015 50)" }}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all"
            style={{ color: "oklch(0.55 0.02 50)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "oklch(0.6 0.22 25)";
              e.currentTarget.style.background = "oklch(0.6 0.22 25 / 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "oklch(0.55 0.02 50)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "oklch(0.12 0.007 50)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
