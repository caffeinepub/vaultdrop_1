import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Star, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../../hooks/useQueries";

export default function DashboardProfile() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

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

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "?";

  const isSubscribed = userProfile?.role === "subscribed";

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
              />
            </div>

            <Button
              type="submit"
              disabled={
                saveProfile.isPending || !username.trim() || !email.trim()
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-semibold"
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
        </motion.div>
      )}
    </div>
  );
}
