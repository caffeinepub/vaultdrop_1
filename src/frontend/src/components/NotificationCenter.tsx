import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellDot,
  CheckCheck,
  Loader2,
  Megaphone,
  RefreshCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Notification, NotificationType } from "../backend";
import {
  useClearReadNotifications,
  useGetCallerNotifications,
  useGetUnreadNotificationCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useQueries";

function timeAgo(ts: bigint): string {
  const diffMs = Date.now() - Number(ts) / 1_000_000;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.purchaseCompleted:
      return <ShoppingBag className="h-3.5 w-3.5" />;
    case NotificationType.newListing:
      return <Sparkles className="h-3.5 w-3.5" />;
    case NotificationType.earlyAccessListing:
      return <Star className="h-3.5 w-3.5" />;
    case NotificationType.subscriptionRenewalWarning:
      return <TriangleAlert className="h-3.5 w-3.5" />;
    case NotificationType.subscriptionExpired:
      return <TriangleAlert className="h-3.5 w-3.5" />;
    case NotificationType.wishlistPriceDrop:
      return <Tag className="h-3.5 w-3.5" />;
    case NotificationType.adminAnnouncement:
      return <Megaphone className="h-3.5 w-3.5" />;
    default:
      return <Bell className="h-3.5 w-3.5" />;
  }
}

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.purchaseCompleted:
      return "oklch(0.72 0.17 160)";
    case NotificationType.newListing:
    case NotificationType.earlyAccessListing:
      return "oklch(0.72 0.17 160)";
    case NotificationType.subscriptionRenewalWarning:
    case NotificationType.subscriptionExpired:
      return "oklch(0.82 0.18 75)";
    case NotificationType.wishlistPriceDrop:
      return "oklch(0.72 0.17 160)";
    case NotificationType.adminAnnouncement:
      return "oklch(0.78 0.19 230)";
    default:
      return "oklch(0.72 0.17 160)";
  }
}

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}

function NotificationItem({
  notification,
  index,
  onMarkRead,
  isMarking,
}: NotificationItemProps) {
  const color = getNotificationColor(notification.notificationType);
  const icon = getNotificationIcon(notification.notificationType);

  return (
    <button
      type="button"
      data-ocid={`notifications.item.${index}`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      className={[
        "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
        notification.isRead
          ? "opacity-60 cursor-default"
          : "hover:bg-primary/5 cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="mt-0.5 p-1.5 rounded-md shrink-0"
          style={{
            background: `${color}1a`,
            color,
            border: `1px solid ${color}33`,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={[
                "text-xs font-display leading-tight",
                notification.isRead
                  ? "font-medium text-foreground/70"
                  : "font-bold text-foreground",
              ].join(" ")}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-[11px] font-body text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] font-body text-muted-foreground/50 mt-1">
            {timeAgo(notification.createdAt)}
          </p>
        </div>

        {/* Mark read indicator */}
        {!notification.isRead && isMarking && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40 mt-1 shrink-0" />
        )}
      </div>
    </button>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0n } = useGetUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useGetCallerNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearRead = useClearReadNotifications();
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadNum = Number(unreadCount);
  const sortedNotifications = [...notifications]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 20);

  const hasRead = notifications.some((n) => n.isRead);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await markRead.mutateAsync(id);
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead.mutateAsync();
      toast.success("Read notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="notifications.bell_button"
          className="relative p-2 rounded-lg text-muted-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-150"
          aria-label="Notifications"
        >
          {unreadNum > 0 ? (
            <BellDot className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadNum > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-display font-black text-white flex items-center justify-center leading-none">
              {unreadNum > 99 ? "99+" : unreadNum}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        data-ocid="notifications.panel"
        className="w-80 p-0 shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-display font-bold text-foreground">
              Notifications
            </span>
            {unreadNum > 0 && (
              <span className="px-1.5 py-px rounded-full text-[10px] font-display font-bold bg-primary/10 text-primary border border-primary/20">
                {unreadNum} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadNum > 0 && (
              <button
                type="button"
                data-ocid="notifications.mark_all_button"
                onClick={handleMarkAll}
                disabled={markAllRead.isPending}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Mark all as read"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
              </button>
            )}
            {hasRead && (
              <button
                type="button"
                data-ocid="notifications.clear_button"
                onClick={handleClearRead}
                disabled={clearRead.isPending}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Clear read notifications"
              >
                {clearRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
            <p className="text-xs font-body text-muted-foreground/50">
              Loading…
            </p>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div
            data-ocid="notifications.empty_state"
            className="flex flex-col items-center justify-center py-10 gap-2 px-4"
          >
            <div className="p-3 rounded-full bg-muted/40 border border-border/40">
              <Bell className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-display font-semibold text-foreground/60">
              No notifications yet
            </p>
            <p className="text-[11px] font-body text-muted-foreground/40 text-center">
              You'll see updates about orders, listings, and more here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[340px]">
            <div className="p-1.5 space-y-0.5">
              {sortedNotifications.map((notif, i) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  index={i + 1}
                  onMarkRead={handleMarkRead}
                  isMarking={markingId === notif.id}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {sortedNotifications.length > 0 && (
          <div className="px-3 py-2 border-t border-border/40">
            <p className="text-[10px] font-body text-muted-foreground/40 text-center">
              Click an unread notification to mark it as read
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
