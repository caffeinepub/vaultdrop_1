import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Shield,
  Store,
  Vault,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          data-ocid="nav.link"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
            <Vault className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-foreground">
            Vault<span className="text-primary">Drop</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/listings"
            className="flex items-center gap-1.5 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.browse.link"
          >
            <Store className="h-4 w-4" />
            Browse
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-muted/60"
                  data-ocid="nav.user.toggle"
                >
                  {/* Avatar with session-active green dot */}
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-display font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Session active indicator */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                      style={{ background: "oklch(0.72 0.17 160)" }}
                      aria-label="Session active"
                      title="Session active"
                    />
                  </div>
                  <span className="hidden sm:block text-sm font-body font-medium text-foreground">
                    {userProfile.username}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-popover border-border/60"
                data-ocid="nav.user.dropdown_menu"
              >
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/dashboard/orders" })}
                  className="cursor-pointer"
                  data-ocid="nav.dashboard.link"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                  My Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/admin/analytics" })}
                      className="cursor-pointer text-admin-accent"
                      data-ocid="nav.admin.link"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />

                {/* Sign out with confirmation dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                      data-ocid="nav.signout.open_modal_button"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent
                    className="bg-popover border-border/60"
                    data-ocid="nav.signout.dialog"
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display font-bold text-foreground">
                        Sign out of VaultDrop?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-body text-muted-foreground">
                        You'll need to sign in again to access your dashboard,
                        orders, and downloads.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        className="font-body"
                        data-ocid="nav.signout.cancel_button"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                        data-ocid="nav.signout.confirm_button"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate({ to: "/sign-in" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-semibold text-sm"
              data-ocid="nav.signin.primary_button"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
