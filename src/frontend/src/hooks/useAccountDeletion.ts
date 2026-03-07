import { useState } from "react";

const DELETION_KEY = (userId: string) => `vaultdrop_deletion_${userId}`;

interface DeletionState {
  requestedAt: string; // ISO
  scheduledAt: string; // ISO — 30 days from request
}

function loadDeletionState(userId: string): DeletionState | null {
  try {
    const raw = localStorage.getItem(DELETION_KEY(userId));
    if (!raw) return null;
    return JSON.parse(raw) as DeletionState;
  } catch {
    return null;
  }
}

function saveDeletionState(userId: string, state: DeletionState): void {
  localStorage.setItem(DELETION_KEY(userId), JSON.stringify(state));
}

function removeDeletionState(userId: string): void {
  localStorage.removeItem(DELETION_KEY(userId));
}

export function useAccountDeletion(userId: string | undefined) {
  const [deletionState, setDeletionState] = useState<DeletionState | null>(
    () => {
      if (!userId) return null;
      return loadDeletionState(userId);
    },
  );

  const requestDeletion = () => {
    if (!userId) return;
    const requestedAt = new Date().toISOString();
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);
    const scheduledAt = scheduledDate.toISOString();
    const state: DeletionState = { requestedAt, scheduledAt };
    saveDeletionState(userId, state);
    setDeletionState(state);
  };

  const cancelDeletion = () => {
    if (!userId) return;
    removeDeletionState(userId);
    setDeletionState(null);
  };

  const daysRemaining: number | null = (() => {
    if (!deletionState) return null;
    const now = Date.now();
    const scheduled = new Date(deletionState.scheduledAt).getTime();
    const diff = Math.ceil((scheduled - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  })();

  return {
    deletionState,
    requestDeletion,
    cancelDeletion,
    daysRemaining,
  };
}
