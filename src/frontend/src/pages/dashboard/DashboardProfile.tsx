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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Loader2,
  Save,
  Star,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccountDeletion } from "../../hooks/useAccountDeletion";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../../hooks/useQueries";

export default function DashboardProfile() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const userId = userProfile?.id;
  const { deletionState, requestDeletion, cancelDeletion, daysRemaining } =
    useAccountDeletion(userId);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username);
      setEmail(userProfile.email);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        email: email.trim(),
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleConfirmDeletion = () => {
    requestDeletion();
    toast.success("Account deletion scheduled. You have 30 days to cancel.");
  };

  const handleCancelDeletion = () => {
    cancelDeletion();
    toast.success("Account deletion cancelled.");
  };

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "?";

  const isSubscribed = userProfile?.role === "subscribed";

  const scheduledDate = deletionState
    ? new Date(deletionState.scheduledAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <User className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground">
            Profile
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Manage your account details
        </p>
      </motion.div>

      {isLoading ? (
        <div className="max-w-md space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md"
        >
          {/* Avatar section */}
          <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border border-border/60 bg-card/50">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-display font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display font-bold text-foreground text-lg">
                {userProfile?.username}
              </p>
              {isSubscribed ? (
                <Badge className="mt-1 bg-primary/15 text-primary border-primary/25 font-display font-semibold text-xs">
                  <Star className="h-2.5 w-2.5 mr-1 fill-primary" />
                  Subscriber
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground font-body">
                  Free plan
                </p>
              )}
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="profile-username"
                className="text-sm font-medium text-foreground/90"
              >
                Username
              </Label>
              <Input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-muted/50 border-border/60 focus:border-primary/60 font-body"
                autoComplete="username"
                data-ocid="profile.input"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="profile-email"
                className="text-sm font-medium text-foreground/90"
              >
                Email address
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50 border-border/60 focus:border-primary/60 font-body"
                autoComplete="email"
                data-ocid="profile.input"
              />
            </div>

            <Button
              type="submit"
              disabled={
                saveProfile.isPending || !username.trim() || !email.trim()
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-semibold"
              data-ocid="profile.save_button"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>

          {/* Danger Zone */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs font-display font-bold uppercase tracking-wider text-destructive/70 px-2">
                Danger Zone
              </span>
              <Separator className="flex-1" />
            </div>

            {deletionState ? (
              /* Pending deletion warning card */
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-full bg-amber-500/15">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-amber-600 dark:text-amber-400 text-sm">
                      Account deletion scheduled
                    </p>
                    <p className="text-sm text-muted-foreground font-body mt-1 leading-relaxed">
                      Your account is scheduled for permanent deletion in{" "}
                      <span className="font-semibold text-foreground">
                        {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                      </span>{" "}
                      (on {scheduledDate}). All your orders, downloads,
                      wishlist, and purchase history will be erased.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelDeletion}
                      className="mt-3 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60 font-display font-semibold"
                      data-ocid="profile.cancel_deletion_button"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancel Deletion
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Delete account card */
              <div className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground text-sm">
                      Delete Account
                    </p>
                    <p className="text-sm text-muted-foreground font-body mt-1 leading-relaxed">
                      Permanently delete your account and all associated data. A
                      30-day grace period applies before irreversible deletion.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 font-display font-semibold"
                        data-ocid="profile.delete_button"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      data-ocid="profile.delete_account.dialog"
                      className="border-border/60"
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display font-black text-foreground">
                          Are you sure you want to delete your account?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-muted-foreground leading-relaxed">
                          Your account will be deactivated and permanently
                          deleted after 30 days. All your orders, downloads,
                          wishlist, and purchase history will be erased. This
                          cannot be undone once the grace period expires.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          data-ocid="profile.delete_account.cancel_button"
                          className="font-display font-semibold"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDeletion}
                          data-ocid="profile.delete_account.confirm_button"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display font-semibold"
                        >
                          Schedule Deletion
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
