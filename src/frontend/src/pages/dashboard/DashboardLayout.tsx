import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Download,
  ExternalLink,
  Heart,
  LogOut,
  ShoppingBag,
  Star,
  User,
  Vault,
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../../hooks/useQueries";

const navItems = [
  { path: "/dashboard/orders", icon: ShoppingBag, label: "Orders" },
  { path: "/dashboard/downloads", icon: Download, label: "Downloads" },
  { path: "/dashboard/subscription", icon: Star, label: "Subscription" },
  { path: "/dashboard/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/dashboard/profile", icon: User, label: "Profile" },
];

export default function DashboardLayout() {
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
    : "?";

  const isSubscribed = userProfile?.role === "subscribed";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        {/* Brand + wordmark */}
        <div className="px-5 h-14 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/35 transition-colors">
              <Vault className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-black text-[15px] text-sidebar-foreground tracking-tight">
              Vault<span className="text-primary">Drop</span>
            </span>
          </Link>
          <NotificationCenter />
        </div>

        {/* User identity block */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-display font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-[13px] text-sidebar-foreground truncate leading-tight">
                {userProfile?.username ?? "—"}
              </p>
              {isSubscribed ? (
                <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-px rounded-full text-[10px] font-display font-bold bg-primary/10 text-primary border border-primary/20">
                  <Star className="h-2.5 w-2.5 fill-primary" />
                  Subscriber
                </span>
              ) : (
                <p className="text-[11px] text-muted-foreground font-body truncate mt-0.5">
                  {userProfile?.email ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-px">
          <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-display font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
            My Account
          </p>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-body font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_oklch(0.72_0.17_160_/_0.2)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
                ].join(" ")}
              >
                <item.icon
                  className={[
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/60",
                  ].join(" ")}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 pb-3 space-y-px border-t border-sidebar-border pt-3">
          <Link
            to="/listings"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-body font-medium text-muted-foreground/60 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground transition-all duration-150"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Browse Store
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-body font-medium text-muted-foreground/60 hover:text-destructive hover:bg-destructive/8 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
