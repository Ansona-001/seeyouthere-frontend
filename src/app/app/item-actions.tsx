"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError, type EventKind, type EventRole } from "@/lib/api";
import { kindNoun } from "@/lib/kind";
import { cn } from "@/lib/utils";

const ICON_BUTTON = "bg-card/90 shadow-sm ring-1 ring-foreground/10 backdrop-blur";

/**
 * Edit and delete icons for one invite or event. Editing is for owners and editors, deleting for owners only
 * (the API enforces both; hiding the buttons just saves a failed request). Render it next to the item's link, not
 * inside it: buttons can't nest in an anchor.
 */
export function ItemActions({
  id,
  title,
  kind,
  role,
  onDeleted,
  className,
}: {
  id: string;
  title: string;
  kind: EventKind;
  role: EventRole;
  /** Called after a successful delete, so a list can drop the row without waiting for the refresh. */
  onDeleted?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noun = kindNoun(kind);
  const name = title || `Untitled ${noun}`;
  const canEdit = role === "owner" || role === "editor";
  const canDelete = role === "owner";
  if (!canEdit && !canDelete) return null;

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await api(`/v1/events/${encodeURIComponent(id)}`, { method: "DELETE" });
      setOpen(false);
      onDeleted?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {canEdit && (
        <Button
          variant="secondary"
          size="icon-sm"
          className={ICON_BUTTON}
          render={<Link href={`/edit/${id}`} aria-label={`Edit ${name}`} title="Edit" />}
          nativeButton={false}
        >
          <Pencil aria-hidden />
        </Button>
      )}
      {canDelete && (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setError(null);
          }}
        >
          <DialogTrigger
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                className={cn(ICON_BUTTON, "text-destructive")}
                aria-label={`Delete ${name}`}
                title="Delete"
              />
            }
          >
            <Trash2 aria-hidden />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this {noun}?</DialogTitle>
              <DialogDescription>
                &ldquo;{name}&rdquo; will be removed for good, along with its guests, RSVPs and photos. This can&rsquo;t be
                undone.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>
                {pending ? "Deleting…" : "Permanently delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
