import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  Loader2,
  Shield,
  ShieldOff,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend";
import {
  useBanUser,
  useGetAllUsers,
  useUnbanUser,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

const DELETIONS_KEY = "vaultdrop_deletions";
const GRACE_DAYS = 30;

interface DeletionEntry {
  scheduledAt: string;
}

function getRoleBadge(role: string, isBanned: boolean) {
  if (isBanned) {
    return {
      bg: "oklch(0.6 0.22 25 / 0.15)",
      text: "oklch(0.6 0.22 25)",
      border: "oklch(0.6 0.22 25 / 0.3)",
      label: "Banned",
    };
  }
  switch (role) {
    case "admin":
      return {
        bg: `${adminGold}1a`,
        text: adminGold,
        border: `${adminGold}4d`,
        label: "Admin",
      };
    case "subscribed":
      return {
        bg: "oklch(0.72 0.17 160 / 0.15)",
        text: "oklch(0.72 0.17 160)",
        border: "oklch(0.72 0.17 160 / 0.3)",
        label: "Subscribed",
      };
    default:
      return {
        bg: "oklch(0.55 0 0 / 0.15)",
        text: "oklch(0.65 0 0)",
        border: "oklch(0.55 0 0 / 0.3)",
        label: "User",
      };
  }
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysRemaining(scheduledAt: string): number {
  const scheduled = new Date(scheduledAt);
  const deleteDate = new Date(
    scheduled.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000,
  );
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function loadDeletions(): Record<string, DeletionEntry> {
  try {
    const raw = localStorage.getItem(DELETIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DeletionEntry>;
  } catch {
    return {};
  }
}

export default function AdminUsers() {
  const { data: users, isLoading } = useGetAllUsers();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const [actionId, setActionId] = useState<string | null>(null);

  const deletions = useMemo(() => loadDeletions(), []);

  const pendingDeletions = useMemo(() => {
    if (!users) return [];
    return Object.entries(deletions)
      .map(([userId, entry]) => {
        const user = users.find((u) => u.id === userId);
        return { userId, entry, user };
      })
      .filter((d) => getDaysRemaining(d.entry.scheduledAt) > 0);
  }, [users, deletions]);

  const handleBan = async (userId: string) => {
    setActionId(userId);
    try {
      await banUser.mutateAsync(userId);
      toast.success("User banned");
    } catch {
      toast.error("Failed to ban user");
    } finally {
      setActionId(null);
    }
  };

  const handleUnban = async (userId: string) => {
    setActionId(userId);
    try {
      await unbanUser.mutateAsync(userId);
      toast.success("User unbanned");
    } catch {
      toast.error("Failed to unban user");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Users
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          Manage platform users
        </p>
      </motion.div>

      <Tabs defaultValue="all" data-ocid="users.tab">
        <TabsList
          className="mb-6"
          style={{
            background: adminCard,
            border: `1px solid ${adminBorder}`,
          }}
        >
          <TabsTrigger
            value="all"
            data-ocid="users.all.tab"
            style={{ color: adminMuted }}
            className="data-[state=active]:text-amber-400 font-display font-semibold"
          >
            All Users {users ? `(${users.length})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="deletions"
            data-ocid="users.deletions.tab"
            style={{ color: adminMuted }}
            className="data-[state=active]:text-amber-400 font-display font-semibold"
          >
            Pending Deletions ({pendingDeletions.length})
          </TabsTrigger>
        </TabsList>

        {/* ── All Users ── */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((key) => (
                <Skeleton key={key} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 gap-4"
              data-ocid="users.empty_state"
            >
              <UserX className="h-10 w-10" style={{ color: adminMuted }} />
              <p
                className="font-display font-semibold"
                style={{ color: adminFg }}
              >
                No users yet
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${adminBorder}` }}
              data-ocid="users.table"
            >
              {/* Header */}
              <div
                className="grid gap-4 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
                style={{
                  background: adminCard,
                  color: adminMuted,
                  gridTemplateColumns: "1fr 180px 120px 90px 80px",
                  borderBottom: `1px solid ${adminBorder}`,
                }}
              >
                <span>Username</span>
                <span>Email</span>
                <span>Joined</span>
                <span>Role</span>
                <span className="text-right">Action</span>
              </div>

              {users.map((user: UserProfile, i) => {
                const badge = getRoleBadge(user.role, user.isBanned);
                const isLoadingAction = actionId === user.id;

                return (
                  <div
                    key={user.id}
                    className="grid gap-4 px-5 py-4 items-center"
                    data-ocid={`users.item.${i + 1}`}
                    style={{
                      gridTemplateColumns: "1fr 180px 120px 90px 80px",
                      borderBottom:
                        i < users.length - 1
                          ? `1px solid ${adminBorder}`
                          : "none",
                      background:
                        i % 2 === 0
                          ? "transparent"
                          : "oklch(0.14 0.01 50 / 0.5)",
                    }}
                  >
                    <p
                      className="font-display font-semibold text-sm"
                      style={{ color: adminFg }}
                    >
                      {user.username}
                    </p>
                    <p
                      className="font-body text-sm truncate"
                      style={{ color: adminMuted }}
                    >
                      {user.email}
                    </p>
                    <p
                      className="font-body text-sm"
                      style={{ color: adminMuted }}
                    >
                      {formatDate(user.createdAt)}
                    </p>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-display font-semibold w-fit"
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                    <div className="flex justify-end">
                      {user.isBanned ? (
                        <button
                          type="button"
                          data-ocid={`users.unban.button.${i + 1}`}
                          onClick={() => handleUnban(user.id)}
                          disabled={isLoadingAction}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-semibold transition-opacity hover:opacity-70"
                          style={{
                            color: "oklch(0.72 0.17 160)",
                            background: "oklch(0.72 0.17 160 / 0.12)",
                          }}
                        >
                          {isLoadingAction ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                          Unban
                        </button>
                      ) : user.role !== "admin" ? (
                        <button
                          type="button"
                          data-ocid={`users.ban.button.${i + 1}`}
                          onClick={() => handleBan(user.id)}
                          disabled={isLoadingAction}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-semibold transition-opacity hover:opacity-70"
                          style={{
                            color: "oklch(0.6 0.22 25)",
                            background: "oklch(0.6 0.22 25 / 0.12)",
                          }}
                        >
                          {isLoadingAction ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          Ban
                        </button>
                      ) : (
                        <span
                          className="text-xs font-body"
                          style={{ color: adminMuted }}
                        >
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>

        {/* ── Pending Deletions ── */}
        <TabsContent value="deletions">
          {pendingDeletions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 gap-4"
              data-ocid="users.deletions.empty_state"
            >
              <Trash2 className="h-10 w-10" style={{ color: adminMuted }} />
              <p
                className="font-display font-semibold"
                style={{ color: adminFg }}
              >
                No pending deletions
              </p>
              <p className="text-sm font-body" style={{ color: adminMuted }}>
                Accounts scheduled for deletion will appear here
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${adminBorder}` }}
              data-ocid="users.deletions.table"
            >
              {/* Header */}
              <div
                className="grid gap-4 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
                style={{
                  background: adminCard,
                  color: adminMuted,
                  gridTemplateColumns: "1fr 180px 160px 100px",
                  borderBottom: `1px solid ${adminBorder}`,
                }}
              >
                <span>Username</span>
                <span>Email</span>
                <span>Scheduled At</span>
                <span>Days Left</span>
              </div>

              {pendingDeletions.map(({ userId, entry, user }, i) => {
                const daysLeft = getDaysRemaining(entry.scheduledAt);
                const isUrgent = daysLeft <= 3;
                return (
                  <div
                    key={userId}
                    className="grid gap-4 px-5 py-4 items-center"
                    data-ocid={`users.deletion.item.${i + 1}`}
                    style={{
                      gridTemplateColumns: "1fr 180px 160px 100px",
                      borderBottom:
                        i < pendingDeletions.length - 1
                          ? `1px solid ${adminBorder}`
                          : "none",
                      background:
                        i % 2 === 0
                          ? "transparent"
                          : "oklch(0.14 0.01 50 / 0.5)",
                    }}
                  >
                    <p
                      className="font-display font-semibold text-sm"
                      style={{ color: adminFg }}
                    >
                      {user?.username ?? `User ${userId.slice(0, 8)}`}
                    </p>
                    <p
                      className="font-body text-sm truncate"
                      style={{ color: adminMuted }}
                    >
                      {user?.email ?? "—"}
                    </p>
                    <div
                      className="flex items-center gap-1.5 text-sm font-body"
                      style={{ color: adminMuted }}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {new Date(entry.scheduledAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-sm font-display font-bold"
                      style={{
                        color: isUrgent
                          ? "oklch(0.6 0.22 25)"
                          : "oklch(0.78 0.19 65)",
                      }}
                    >
                      {isUrgent && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {daysLeft}d
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
