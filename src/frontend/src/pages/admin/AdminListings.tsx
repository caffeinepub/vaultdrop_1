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
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type Listing, ListingStatus } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";

import {
  useCreateListing,
  useDeleteListing,
  useGetListings,
  useUpdateListing,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

interface ListingFormData {
  title: string;
  description: string;
  price: string; // display as dollars
  status: ListingStatus;
  previewImageKey: string | null;
  fileKey: string | null;
}

const emptyForm: ListingFormData = {
  title: "",
  description: "",
  price: "",
  status: ListingStatus.draft,
  previewImageKey: null,
  fileKey: null,
};

function getStatusBadge(status: ListingStatus) {
  const styles: Record<
    ListingStatus,
    { bg: string; text: string; border: string; label: string }
  > = {
    [ListingStatus.published]: {
      bg: "oklch(0.72 0.17 160 / 0.15)",
      text: "oklch(0.72 0.17 160)",
      border: "oklch(0.72 0.17 160 / 0.3)",
      label: "Published",
    },
    [ListingStatus.upcoming]: {
      bg: "oklch(0.82 0.18 75 / 0.15)",
      text: "oklch(0.82 0.18 75)",
      border: "oklch(0.82 0.18 75 / 0.3)",
      label: "Upcoming",
    },
    [ListingStatus.draft]: {
      bg: "oklch(0.55 0 0 / 0.15)",
      text: "oklch(0.65 0 0)",
      border: "oklch(0.55 0 0 / 0.3)",
      label: "Draft",
    },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-display font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

export default function AdminListings() {
  const { data: backendListings, isLoading } = useGetListings();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const listings =
    backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [form, setForm] = useState<ListingFormData>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditingListing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (listing: Listing) => {
    setEditingListing(listing);
    setForm({
      title: listing.title,
      description: listing.description,
      price: (Number(listing.price) / 100).toFixed(2),
      status: listing.status,
      previewImageKey: listing.previewImageKey ?? null,
      fileKey: listing.fileKey ?? null,
    });
    setModalOpen(true);
  };

  const handleUpload = async (
    _file: File,
    type: "image" | "file",
  ): Promise<string | null> => {
    // Blob storage upload — keys are stored as file names for now
    // In production this would use StorageClient with proper config
    if (type === "image") setUploadingImage(true);
    else setUploadingFile(true);

    try {
      // Simulate upload delay (replace with real StorageClient in production)
      await new Promise((r) => setTimeout(r, 800));
      const mockKey = `sha256:${Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
      return mockKey;
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("File upload failed");
      return null;
    } finally {
      if (type === "image") setUploadingImage(false);
      else setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = BigInt(Math.round(Number.parseFloat(form.price) * 100));

    try {
      if (editingListing) {
        await updateListing.mutateAsync({
          listingId: editingListing.id,
          title: form.title,
          description: form.description,
          price: priceCents,
          status: form.status,
          previewImageKey: form.previewImageKey,
          fileKey: form.fileKey,
        });
        toast.success("Listing updated");
      } else {
        await createListing.mutateAsync({
          title: form.title,
          description: form.description,
          price: priceCents,
          status: form.status,
          previewImageKey: form.previewImageKey,
          fileKey: form.fileKey,
        });
        toast.success("Listing created");
      }
      setModalOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Failed to save listing");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteListing.mutateAsync(deleteTarget.id);
      toast.success("Listing deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  const isPending = createListing.isPending || updateListing.isPending;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Package className="h-5 w-5" style={{ color: adminGold }} />
            <h1
              className="text-2xl font-display font-black"
              style={{ color: adminFg }}
            >
              Listings
            </h1>
          </div>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            Manage all digital products
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="font-display font-bold shadow-glow-admin"
          style={{
            background: adminGold,
            color: "oklch(0.1 0.01 65)",
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Listing
        </Button>
      </motion.div>

      {/* Listings table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${adminBorder}` }}
        >
          {/* Table header */}
          <div
            className="grid gap-4 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
            style={{
              background: adminCard,
              color: adminMuted,
              gridTemplateColumns: "1fr 80px 100px 80px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Product</span>
            <span>Price</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="grid gap-4 px-5 py-4 items-center"
              style={{
                gridTemplateColumns: "1fr 80px 100px 80px",
                borderBottom:
                  i < listings.length - 1 ? `1px solid ${adminBorder}` : "none",
                background:
                  i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
              }}
            >
              <div className="min-w-0">
                <p
                  className="font-display font-semibold text-sm truncate"
                  style={{ color: adminFg }}
                >
                  {listing.title}
                </p>
                <p
                  className="text-xs font-body truncate mt-0.5"
                  style={{ color: adminMuted }}
                >
                  {listing.description.slice(0, 60)}…
                </p>
              </div>
              <p
                className="font-display font-bold text-sm"
                style={{ color: adminGold }}
              >
                ${(Number(listing.price) / 100).toFixed(2)}
              </p>
              <div>{getStatusBadge(listing.status)}</div>
              <div className="flex gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => openEdit(listing)}
                  className="p-1.5 rounded-md transition-colors hover:opacity-80"
                  style={{ color: adminMuted }}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(listing)}
                  className="p-1.5 rounded-md transition-colors hover:opacity-80"
                  style={{ color: "oklch(0.6 0.22 25)" }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg"
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display font-bold"
              style={{ color: adminFg }}
            >
              {editingListing ? "Edit Listing" : "New Listing"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                className="font-display text-xs font-semibold uppercase tracking-wider"
                style={{ color: adminMuted }}
              >
                Title
              </Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                placeholder="Product name"
                style={{
                  background: "oklch(0.12 0.008 50)",
                  borderColor: adminBorder,
                  color: adminFg,
                }}
                className="font-body"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                className="font-display text-xs font-semibold uppercase tracking-wider"
                style={{ color: adminMuted }}
              >
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
                rows={3}
                placeholder="Describe the product"
                style={{
                  background: "oklch(0.12 0.008 50)",
                  borderColor: adminBorder,
                  color: adminFg,
                }}
                className="font-body resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  className="font-display text-xs font-semibold uppercase tracking-wider"
                  style={{ color: adminMuted }}
                >
                  Price ($)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  placeholder="9.99"
                  style={{
                    background: "oklch(0.12 0.008 50)",
                    borderColor: adminBorder,
                    color: adminFg,
                  }}
                  className="font-body"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-display text-xs font-semibold uppercase tracking-wider"
                  style={{ color: adminMuted }}
                >
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as ListingStatus }))
                  }
                >
                  <SelectTrigger
                    style={{
                      background: "oklch(0.12 0.008 50)",
                      borderColor: adminBorder,
                      color: adminFg,
                    }}
                    className="font-body"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{ background: adminCard, borderColor: adminBorder }}
                  >
                    <SelectItem
                      value={ListingStatus.draft}
                      className="font-body"
                    >
                      Draft
                    </SelectItem>
                    <SelectItem
                      value={ListingStatus.published}
                      className="font-body"
                    >
                      Published
                    </SelectItem>
                    <SelectItem
                      value={ListingStatus.upcoming}
                      className="font-body"
                    >
                      Upcoming
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  className="font-display text-xs font-semibold uppercase tracking-wider"
                  style={{ color: adminMuted }}
                >
                  Preview Image
                </Label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const key = await handleUpload(file, "image");
                    if (key) setForm((f) => ({ ...f, previewImageKey: key }));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full font-display font-semibold text-xs"
                  style={{ borderColor: adminBorder, color: adminMuted }}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {form.previewImageKey ? "Uploaded ✓" : "Upload Image"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-display text-xs font-semibold uppercase tracking-wider"
                  style={{ color: adminMuted }}
                >
                  Download File
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const key = await handleUpload(file, "file");
                    if (key) setForm((f) => ({ ...f, fileKey: key }));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full font-display font-semibold text-xs"
                  style={{ borderColor: adminBorder, color: adminMuted }}
                >
                  {uploadingFile ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {form.fileKey ? "Uploaded ✓" : "Upload File"}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="font-display font-semibold"
                style={{ color: adminMuted }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="font-display font-bold"
                style={{ background: adminGold, color: "oklch(0.1 0.01 65)" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editingListing ? (
                  "Update Listing"
                ) : (
                  "Create Listing"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="font-display font-bold"
              style={{ color: adminFg }}
            >
              Delete Listing?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-body"
              style={{ color: adminMuted }}
            >
              This will permanently delete "{deleteTarget?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-display font-semibold"
              style={{ color: adminMuted }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="font-display font-bold"
              style={{ background: "oklch(0.6 0.22 25)", color: "white" }}
            >
              {deleteListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
