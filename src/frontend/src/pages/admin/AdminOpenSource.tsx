import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  Github,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { OpenSourceProject } from "../../backend";
import {
  useCreateOpenSourceProject,
  useDeleteOpenSourceProject,
  useGetAllOpenSourceProjects,
  useGetProjectTips,
  useUpdateOpenSourceProject,
} from "../../hooks/useQueries";

// ─── Theme constants ─────────────────────────────────────────────────────────

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectFormData {
  title: string;
  description: string;
  repoUrl: string;
  creatorName: string;
  suggestedTipDollars: string;
  previewImageKey: string;
  isActive: boolean;
}

const emptyForm: ProjectFormData = {
  title: "",
  description: "",
  repoUrl: "",
  creatorName: "",
  suggestedTipDollars: "5.00",
  previewImageKey: "",
  isActive: true,
};

// ─── Tips Row ────────────────────────────────────────────────────────────────

function TipsPanel({ projectId }: { projectId: string }) {
  const { data: tips, isLoading } = useGetProjectTips(projectId);

  const totalCents = (tips ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

  if (isLoading) {
    return (
      <div className="px-5 py-4 space-y-2">
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  return (
    <div
      className="px-5 py-4 text-sm font-body"
      style={{ color: adminMuted, background: "oklch(0.11 0.007 50)" }}
    >
      <div className="flex items-center gap-6">
        <span>
          Tips received:{" "}
          <strong style={{ color: adminGold }}>{tips?.length ?? 0}</strong>
        </span>
        <span>
          Total collected:{" "}
          <strong style={{ color: adminGold }}>
            ${(totalCents / 100).toFixed(2)}
          </strong>
        </span>
        {tips && tips.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {tips.slice(0, 5).map((tip, i) => (
              <span
                key={tip.id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.78 0.19 65 / 0.1)",
                  color: adminGold,
                  border: "1px solid oklch(0.78 0.19 65 / 0.25)",
                }}
              >
                #{i + 1} ${(Number(tip.amount) / 100).toFixed(2)} · {tip.status}
              </span>
            ))}
            {tips.length > 5 && (
              <span className="text-xs" style={{ color: adminMuted }}>
                +{tips.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOpenSource() {
  const { data: projects, isLoading } = useGetAllOpenSourceProjects();
  const createProject = useCreateOpenSourceProject();
  const updateProject = useUpdateOpenSourceProject();
  const deleteProject = useDeleteOpenSourceProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<OpenSourceProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OpenSourceProject | null>(
    null,
  );
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<ProjectFormData>(emptyForm);

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (project: OpenSourceProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      creatorName: project.creatorName,
      suggestedTipDollars: (Number(project.suggestedTipCents) / 100).toFixed(2),
      previewImageKey: project.previewImageKey ?? "",
      isActive: project.isActive,
    });
    setDialogOpen(true);
  };

  const toggleTips = (projectId: string) => {
    setExpandedTips((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tipCents = Math.round(
      Number.parseFloat(form.suggestedTipDollars) * 100,
    );
    if (Number.isNaN(tipCents) || tipCents <= 0) {
      toast.error("Enter a valid tip amount");
      return;
    }

    try {
      if (editingProject) {
        await updateProject.mutateAsync({
          id: editingProject.id,
          title: form.title,
          description: form.description,
          repoUrl: form.repoUrl,
          creatorName: form.creatorName,
          suggestedTipCents: BigInt(tipCents),
          previewImageKey: form.previewImageKey || null,
          isActive: form.isActive,
        });
        toast.success("Project updated");
      } else {
        await createProject.mutateAsync({
          title: form.title,
          description: form.description,
          repoUrl: form.repoUrl,
          creatorName: form.creatorName,
          suggestedTipCents: BigInt(tipCents),
          previewImageKey: form.previewImageKey || null,
        });
        toast.success("Project added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save project");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject.mutateAsync(deleteTarget.id);
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Github className="h-5 w-5" style={{ color: adminGold }} />
            <h1
              className="text-2xl font-display font-black"
              style={{ color: adminFg }}
            >
              Open Source
            </h1>
          </div>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            Manage open-source projects and tip jar listings
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          data-ocid="opensource.add.primary_button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-opacity hover:opacity-80"
          style={{
            background: "oklch(0.78 0.19 65 / 0.15)",
            color: adminGold,
            border: "1px solid oklch(0.78 0.19 65 / 0.35)",
          }}
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-28 gap-5"
          data-ocid="opensource.empty_state"
        >
          <Github className="h-12 w-12" style={{ color: adminMuted }} />
          <p className="font-display font-semibold" style={{ color: adminFg }}>
            No projects yet
          </p>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            Add your first open-source project to get started
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold mt-2 transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.78 0.19 65 / 0.15)",
              color: adminGold,
              border: "1px solid oklch(0.78 0.19 65 / 0.35)",
            }}
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${adminBorder}` }}
          data-ocid="opensource.table"
        >
          {/* Header */}
          <div
            className="grid gap-3 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
            style={{
              background: adminCard,
              color: adminMuted,
              gridTemplateColumns: "1fr 160px 120px 100px 80px 80px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Title / Creator</span>
            <span>Repo URL</span>
            <span>Suggested Tip</span>
            <span>Status</span>
            <span>Tips</span>
            <span className="text-right">Actions</span>
          </div>

          {projects.map((project, i) => (
            <div key={project.id}>
              <div
                className="grid gap-3 px-5 py-4 items-center"
                data-ocid={`opensource.row.${i + 1}`}
                style={{
                  gridTemplateColumns: "1fr 160px 120px 100px 80px 80px",
                  borderBottom: `1px solid ${adminBorder}`,
                  background:
                    i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
                }}
              >
                {/* Title + creator */}
                <div className="min-w-0">
                  <p
                    className="font-display font-semibold text-sm truncate"
                    style={{ color: adminFg }}
                  >
                    {project.title}
                  </p>
                  <p
                    className="text-xs font-body truncate"
                    style={{ color: adminMuted }}
                  >
                    by {project.creatorName}
                  </p>
                </div>

                {/* Repo URL */}
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-body truncate hover:underline"
                  style={{ color: "oklch(0.72 0.17 160)" }}
                >
                  {project.repoUrl.replace(/^https?:\/\//, "").slice(0, 30)}
                  {project.repoUrl.replace(/^https?:\/\//, "").length > 30
                    ? "…"
                    : ""}
                </a>

                {/* Suggested tip */}
                <div
                  className="flex items-center gap-1 text-sm font-display font-bold"
                  style={{ color: adminGold }}
                >
                  <Coffee className="h-3.5 w-3.5" />$
                  {(Number(project.suggestedTipCents) / 100).toFixed(2)}
                </div>

                {/* Status */}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-display font-semibold w-fit"
                  style={
                    project.isActive
                      ? {
                          background: "oklch(0.72 0.17 160 / 0.15)",
                          color: "oklch(0.72 0.17 160)",
                          border: "1px solid oklch(0.72 0.17 160 / 0.3)",
                        }
                      : {
                          background: "oklch(0.55 0 0 / 0.15)",
                          color: "oklch(0.55 0 0)",
                          border: "1px solid oklch(0.45 0 0 / 0.3)",
                        }
                  }
                >
                  {project.isActive ? "Active" : "Inactive"}
                </span>

                {/* Tips expand */}
                <button
                  type="button"
                  onClick={() => toggleTips(project.id)}
                  data-ocid={`opensource.tips.toggle.${i + 1}`}
                  className="flex items-center gap-1 text-xs font-display font-semibold transition-opacity hover:opacity-70"
                  style={{ color: adminGold }}
                >
                  {expandedTips.has(project.id) ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  Tips
                </button>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(project)}
                    data-ocid={`opensource.edit.button.${i + 1}`}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{
                      color: adminGold,
                      background: "oklch(0.78 0.19 65 / 0.1)",
                    }}
                    aria-label="Edit project"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(project)}
                    data-ocid={`opensource.delete.button.${i + 1}`}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{
                      color: "oklch(0.6 0.22 25)",
                      background: "oklch(0.6 0.22 25 / 0.1)",
                    }}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expandable tips panel */}
              {expandedTips.has(project.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ borderBottom: `1px solid ${adminBorder}` }}
                >
                  <TipsPanel projectId={project.id} />
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: "oklch(0.13 0.008 50)",
            border: `1px solid ${adminBorder}`,
          }}
          data-ocid="opensource.dialog"
        >
          <DialogHeader>
            <DialogTitle
              className="font-display font-black text-lg"
              style={{ color: adminFg }}
            >
              {editingProject ? "Edit Project" : "Add Open-Source Project"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-title"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Title *
              </Label>
              <Input
                id="os-title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="My Awesome Library"
                data-ocid="opensource.title.input"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Creator */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-creator"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Creator Name *
              </Label>
              <Input
                id="os-creator"
                required
                value={form.creatorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, creatorName: e.target.value }))
                }
                placeholder="Jane Doe"
                data-ocid="opensource.creator.input"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Repo URL */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-repo"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Repository URL *
              </Label>
              <Input
                id="os-repo"
                required
                type="url"
                value={form.repoUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, repoUrl: e.target.value }))
                }
                placeholder="https://github.com/user/repo"
                data-ocid="opensource.repo.input"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-desc"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Description *
              </Label>
              <Textarea
                id="os-desc"
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="A brief description of what this project does..."
                data-ocid="opensource.description.textarea"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Suggested tip */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-tip"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Suggested Tip (USD) *
              </Label>
              <Input
                id="os-tip"
                required
                type="number"
                min="0.50"
                step="0.01"
                value={form.suggestedTipDollars}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    suggestedTipDollars: e.target.value,
                  }))
                }
                placeholder="5.00"
                data-ocid="opensource.tip.input"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Preview image key */}
            <div className="space-y-1.5">
              <Label
                htmlFor="os-image"
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: adminMuted }}
              >
                Preview Image Path (optional)
              </Label>
              <Input
                id="os-image"
                value={form.previewImageKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, previewImageKey: e.target.value }))
                }
                placeholder="/assets/generated/my-project.jpg"
                data-ocid="opensource.image.input"
                style={{
                  background: adminCard,
                  borderColor: adminBorder,
                  color: adminFg,
                }}
              />
            </div>

            {/* Active toggle — only for edit */}
            {editingProject && (
              <div className="flex items-center justify-between py-2">
                <Label
                  htmlFor="os-active"
                  className="text-xs font-display font-semibold uppercase tracking-widest cursor-pointer"
                  style={{ color: adminMuted }}
                >
                  Active (visible to public)
                </Label>
                <Switch
                  id="os-active"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: v }))
                  }
                  data-ocid="opensource.active.switch"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                data-ocid="opensource.dialog.cancel_button"
                style={{ color: adminMuted }}
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isPending}
                data-ocid="opensource.dialog.submit_button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  background: "oklch(0.78 0.19 65 / 0.2)",
                  color: adminGold,
                  border: "1px solid oklch(0.78 0.19 65 / 0.4)",
                }}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProject ? "Save Changes" : "Add Project"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          style={{
            background: "oklch(0.13 0.008 50)",
            border: `1px solid ${adminBorder}`,
          }}
          data-ocid="opensource.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="font-display font-bold"
              style={{ color: adminFg }}
            >
              Delete Project?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-body"
              style={{ color: adminMuted }}
            >
              This will permanently delete{" "}
              <strong style={{ color: adminFg }}>{deleteTarget?.title}</strong>{" "}
              and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-body"
              style={{ borderColor: adminBorder, color: adminMuted }}
              data-ocid="opensource.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              data-ocid="opensource.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
            >
              {deleteProject.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
