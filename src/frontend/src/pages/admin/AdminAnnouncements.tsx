import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Megaphone, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSendAdminAnnouncement } from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

export default function AdminAnnouncements() {
  const sendAnnouncement = useSendAdminAnnouncement();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccessfully, setSentSuccessfully] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      await sendAnnouncement.mutateAsync({
        title: title.trim(),
        message: message.trim(),
      });
      toast.success("Announcement sent to all users");
      setSentSuccessfully(true);
      setTitle("");
      setMessage("");
      setTimeout(() => setSentSuccessfully(false), 4000);
    } catch {
      toast.error("Failed to send announcement");
    }
  };

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
          <Megaphone className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Announcements
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          Send messages directly to all users' notification centers
        </p>
      </motion.div>

      <div className="max-w-xl">
        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{
            background: `${adminGold}0d`,
            border: `1px solid ${adminGold}29`,
          }}
        >
          <Megaphone
            className="h-4 w-4 mt-0.5 shrink-0"
            style={{ color: adminGold }}
          />
          <div>
            <p
              className="text-xs font-display font-semibold"
              style={{ color: adminGold }}
            >
              Broadcast Announcement
            </p>
            <p
              className="text-xs font-body mt-0.5"
              style={{ color: adminMuted }}
            >
              This message will appear in the notification center of every
              registered user on the platform.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-5"
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <h2
            className="font-display font-bold text-sm"
            style={{ color: adminFg }}
          >
            New Announcement
          </h2>

          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ann-title"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Title <span style={{ color: "oklch(0.6 0.22 25)" }}>*</span>
            </Label>
            <Input
              id="ann-title"
              data-ocid="announcement.title_input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important platform update…"
              required
              maxLength={120}
              style={{
                background: "oklch(0.12 0.008 50)",
                borderColor: adminBorder,
                color: adminFg,
              }}
              className="font-body"
            />
            <p
              className="text-xs font-body text-right"
              style={{ color: adminMuted }}
            >
              {title.length}/120
            </p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ann-message"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Message <span style={{ color: "oklch(0.6 0.22 25)" }}>*</span>
            </Label>
            <Textarea
              id="ann-message"
              data-ocid="announcement.message_textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement here…"
              required
              maxLength={500}
              rows={5}
              style={{
                background: "oklch(0.12 0.008 50)",
                borderColor: adminBorder,
                color: adminFg,
                resize: "none",
              }}
              className="font-body"
            />
            <p
              className="text-xs font-body text-right"
              style={{ color: adminMuted }}
            >
              {message.length}/500
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            data-ocid="announcement.send_button"
            disabled={
              sendAnnouncement.isPending || !title.trim() || !message.trim()
            }
            className="font-display font-bold w-full"
            style={{ background: adminGold, color: "oklch(0.1 0.01 65)" }}
          >
            {sendAnnouncement.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send to All Users
              </>
            )}
          </Button>
        </motion.form>

        {/* Success state */}
        <AnimatePresence>
          {sentSuccessfully && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              data-ocid="announcement.success_state"
              className="mt-4 rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "oklch(0.72 0.17 160 / 0.12)",
                border: "1px solid oklch(0.72 0.17 160 / 0.3)",
              }}
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0"
                style={{ color: "oklch(0.72 0.17 160)" }}
              />
              <div>
                <p
                  className="text-sm font-display font-bold"
                  style={{ color: "oklch(0.72 0.17 160)" }}
                >
                  Announcement sent!
                </p>
                <p className="text-xs font-body" style={{ color: adminMuted }}>
                  All users will see this in their notification center.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
