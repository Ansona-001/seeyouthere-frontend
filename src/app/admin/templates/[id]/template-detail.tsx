"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { EventView } from "@/components/event/event-view";
import { previewSampleContent, previewSampleMedia, previewSampleStartsAt } from "@/components/event/preview-sample";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  ApiError,
  type AdminTemplateDetail,
  type AdminTemplatePreviewResponse,
  type AdminTemplateVersion,
} from "@/lib/api";
import { templateErrorMessage } from "@/lib/admin-confirm";
import { formatDateTime } from "@/lib/format";

export function TemplateDetail({ template }: { template: AdminTemplateDetail }) {
  const router = useRouter();
  const published = template.status === "published";
  const [isPremium, setIsPremium] = useState(template.is_premium);
  const [drafts, setDrafts] = useState<Record<number, string>>(
    Object.fromEntries(template.versions.map((v) => [v.version, JSON.stringify(v.manifest, null, 2)])),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<number, AdminTemplatePreviewResponse["previews"]>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  async function run(key: string, action: () => Promise<void>) {
    setPending(key);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(templateErrorMessage(err instanceof ApiError ? err : null));
    } finally {
      setPending(null);
    }
  }

  function togglePremium(next: boolean) {
    setIsPremium(next);
    return run("premium", () => api(`/v1/admin/templates/${template.id}`, { method: "PATCH", json: { is_premium: next } }));
  }

  function setStatus(next: "draft" | "published") {
    return run("status", () => api(`/v1/admin/templates/${template.id}`, { method: "PATCH", json: { status: next } }));
  }

  function saveVersion(version: number) {
    return run(`save:${version}`, async () => {
      let manifest: unknown;
      try {
        manifest = JSON.parse(drafts[version]);
      } catch {
        throw new ApiError(400, "invalid_json", "That manifest isn't valid JSON.");
      }
      await api(`/v1/admin/templates/${template.id}/versions/${version}`, { method: "PUT", json: { manifest } });
    });
  }

  function publishVersion(version: number) {
    return run(`publish:${version}`, () =>
      api(`/v1/admin/templates/${template.id}/versions/${version}/publish`, { method: "POST" }),
    );
  }

  function newVersion() {
    return run("new-version", () =>
      api(`/v1/admin/templates/${template.id}/versions`, {
        method: "POST",
        json: { copy_from_version: template.latest_version },
      }),
    );
  }

  async function uploadBackground(version: number) {
    const file = fileInputs.current[version]?.files?.[0];
    if (!file) return;
    await run(`background:${version}`, () =>
      api(`/v1/admin/templates/${template.id}/versions/${version}/background`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      }),
    );
  }

  async function loadPreview(version: number) {
    setPending(`preview:${version}`);
    setError(null);
    try {
      const res = await api<AdminTemplatePreviewResponse>(
        `/v1/admin/templates/${template.id}/versions/${version}/preview`,
      );
      setPreviews((prev) => ({ ...prev, [version]: res.previews }));
    } catch (err) {
      setError(templateErrorMessage(err instanceof ApiError ? err : null));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <p className="text-sm text-muted-foreground">
        A version is the design. The template is only visible to hosts once it is published.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Availability
            <Badge variant={published ? "secondary" : "outline"}>Template {template.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div>
              <Button
                variant={published ? "outline" : "default"}
                disabled={pending !== null}
                onClick={() => setStatus(published ? "draft" : "published")}
              >
                {pending === "status"
                  ? published ? "Unpublishing…" : "Publishing…"
                  : published ? "Unpublish template" : "Publish template"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Published templates appear in the host picker. Unpublishing hides it for new events; events already using
              it keep working.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="premium" checked={isPremium} disabled={pending !== null} onCheckedChange={togglePremium} />
            <label htmlFor="premium" className="text-sm font-medium">
              Premium (hidden from the host picker; assign manually from an event&rsquo;s admin flags)
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg text-brand-heading">Versions</h2>
        <Button variant="outline" disabled={pending !== null} onClick={newVersion}>
          {pending === "new-version" ? "Creating…" : "New draft version"}
        </Button>
      </div>

      {template.versions
        .slice()
        .sort((a, b) => b.version - a.version)
        .map((v) => (
          <VersionCard
            key={v.version}
            version={v}
            draft={drafts[v.version] ?? ""}
            onDraftChange={(text) => setDrafts((prev) => ({ ...prev, [v.version]: text }))}
            pending={pending}
            templateId={template.id}
            onSave={() => saveVersion(v.version)}
            onPublish={() => publishVersion(v.version)}
            onUpload={() => uploadBackground(v.version)}
            fileInputRef={(el) => {
              fileInputs.current[v.version] = el;
            }}
            onPreview={() => loadPreview(v.version)}
            previews={previews[v.version]}
          />
        ))}
    </div>
  );
}

function VersionCard({
  version,
  draft,
  onDraftChange,
  pending,
  templateId,
  onSave,
  onPublish,
  onUpload,
  fileInputRef,
  onPreview,
  previews,
}: {
  version: AdminTemplateVersion;
  draft: string;
  onDraftChange: (text: string) => void;
  pending: string | null;
  templateId: string;
  onSave: () => void;
  onPublish: () => void;
  onUpload: () => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onPreview: () => void;
  previews?: AdminTemplatePreviewResponse["previews"];
}) {
  const locked = version.status === "published";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Version {version.version}
          <Badge variant={locked ? "default" : "outline"}>
            Version {version.version} {version.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {locked ? `Published ${formatDateTime(version.published_at)}` : "Draft — edit and publish when ready."}
        </p>
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          disabled={locked}
          rows={12}
          className="font-mono text-sm"
          aria-label={`Manifest JSON for version ${version.version}`}
        />
        {!locked && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              className="max-w-full text-sm file:mr-3 file:min-h-9 file:rounded-full file:border file:border-input file:bg-card file:px-3.5 file:text-sm file:font-semibold"
              aria-label="Background image"
            />
            <Button variant="outline" disabled={pending !== null} onClick={onUpload}>
              {pending === `background:${version.version}` ? "Uploading…" : "Upload background"}
            </Button>
          </div>
        )}
        {previews && <ThemePreview previews={previews} />}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {!locked && (
          <>
            <Button variant="outline" disabled={pending !== null} onClick={onSave}>
              {pending === `save:${version.version}` ? "Saving…" : "Save manifest"}
            </Button>
            <Button disabled={pending !== null} onClick={onPublish}>
              {pending === `publish:${version.version}` ? "Publishing…" : "Publish"}
            </Button>
            <DeleteDraftDialog templateId={templateId} version={version.version} disabled={pending !== null} />
          </>
        )}
        <Button variant="ghost" disabled={pending !== null} onClick={onPreview}>
          {pending === `preview:${version.version}` ? "Loading preview…" : "Preview theme colours"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ThemePreview({ previews }: { previews: AdminTemplatePreviewResponse["previews"] }) {
  const [selected, setSelected] = useState(0);
  const [content] = useState(previewSampleContent);
  const current = previews[Math.min(selected, previews.length - 1)];
  if (!current) return <p className="text-sm text-muted-foreground">This version has no palettes to preview.</p>;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-2" aria-label="Palette and font">
        {previews.map((p, i) => (
          <li key={`${p.palette_id}-${p.font_id}`}>
            <button
              type="button"
              aria-pressed={previews[selected] === p}
              onClick={() => setSelected(i)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-input px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-ring"
              style={{ background: p.theme.palette.background, color: p.theme.palette.text }}
            >
              <span className="size-3.5 rounded-full ring-1 ring-border" style={{ background: p.theme.palette.accent }} aria-hidden />
              {p.palette_id} / {p.font_id}
            </button>
          </li>
        ))}
      </ul>
      <div className="mx-auto h-[640px] w-full max-w-[420px] overflow-y-auto rounded-xl border border-input [container-type:inline-size]">
        <EventView
          content={content}
          theme={current.theme}
          media={previewSampleMedia}
          mode="preview"
          startsAt={previewSampleStartsAt}
        />
      </div>
    </div>
  );
}

function DeleteDraftDialog({ templateId, version, disabled }: { templateId: string; version: number; disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await api(`/v1/admin/templates/${templateId}/versions/${version}`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(templateErrorMessage(err instanceof ApiError ? err : null));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return; // no Escape, backdrop or close while deleting
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger render={<Button variant="destructive" disabled={disabled} />}>Delete draft</DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Delete draft version {version}?</DialogTitle>
          <DialogDescription>This can&rsquo;t be undone.</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
