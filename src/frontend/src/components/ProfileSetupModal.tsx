import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Vault } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUsername(value: string): string | null {
  if (!value.trim()) return "Username is required.";
  if (!USERNAME_REGEX.test(value.trim()))
    return "3–20 characters. Letters, numbers, and underscores only.";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email address is required.";
  if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address.";
  return null;
}

export default function ProfileSetupModal() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const saveProfile = useSaveCallerUserProfile();

  const usernameError = usernameTouched ? validateUsername(username) : null;
  const emailError = emailTouched ? validateEmail(email) : null;

  const isValid =
    validateUsername(username) === null && validateEmail(email) === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Touch all fields on submit to surface errors
    setUsernameTouched(true);
    setEmailTouched(true);
    if (!isValid) return;

    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        email: email.trim(),
      });
      toast.success("Profile created! Welcome to VaultDrop.");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-8 shadow-card-glow">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Vault className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground glow-text">
                Welcome to VaultDrop
              </h2>
              <p className="text-sm text-muted-foreground mt-1 font-body">
                Set up your profile to get started
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground/90"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setUsernameTouched(true)}
                aria-invalid={!!usernameError}
                aria-describedby={usernameError ? "username-error" : undefined}
                className={`bg-muted/50 border-border/60 focus:border-primary/60 focus:ring-primary/20 font-body ${
                  usernameError
                    ? "border-destructive/60 focus:border-destructive/60"
                    : ""
                }`}
                autoComplete="username"
                data-ocid="profile-setup.input"
              />
              {usernameError && (
                <p
                  id="username-error"
                  className="text-destructive text-xs mt-1"
                  role="alert"
                  data-ocid="profile-setup.error_state"
                >
                  {usernameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground/90"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`bg-muted/50 border-border/60 focus:border-primary/60 focus:ring-primary/20 font-body ${
                  emailError
                    ? "border-destructive/60 focus:border-destructive/60"
                    : ""
                }`}
                autoComplete="email"
                data-ocid="profile-setup.textarea"
              />
              {emailError && (
                <p
                  id="email-error"
                  className="text-destructive text-xs mt-1"
                  role="alert"
                  data-ocid="profile-setup.error_state"
                >
                  {emailError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                saveProfile.isPending ||
                (usernameTouched && emailTouched && !isValid)
              }
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold shadow-glow"
              data-ocid="profile-setup.submit_button"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating profile…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enter the Vault
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
