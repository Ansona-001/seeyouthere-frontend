"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { EventView } from "@/components/event/event-view";
import { previewSampleContent, previewSampleMedia, previewSampleStartsAt } from "@/components/event/preview-sample";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  ApiError,
  type AdminTemplateDetail,
  type AdminTemplatePreviewResponse,
  type AdminTemplateVersion,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function TemplateDetail({ template }: { template: AdminTemplateDetail }) {
  const router = useRouter();
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
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function togglePremium(next: boolean) {
    setIsPremium(next);
    return run("premium", () => api(`/v1/admin/templates/${template.id}`, { method: "PATCH", json: { is_premium: next } }));
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
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch id="premium" checked={isPremium} disabled={pending !== null} onCheckedChange={togglePremium} />
          <label htmlFor="premium" className="text-sm">
            Premium (hidden from the host picker; assign manually from an event&rsquo;s admin flags)
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Versions</h2>
        <Button variant="outline" size="sm" disabled={pending !== null} onClick={newVersion}>
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
          <Badge variant={locked ? "secondary" : "outline"}>{version.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          {locked ? `Published ${formatDateTime(version.published_at)}` : "Draft — edit and publish when ready."}
        </p>
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          disabled={locked}
          rows={12}
          className="font-mono text-xs"
          aria-label={`Manifest JSON for version ${version.version}`}
        />
        {!locked && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              className="text-sm"
              aria-label="Background image"
            />
            <Button variant="outline" size="sm" disabled={pending !== null} onClick={onUpload}>
              {pending === `background:${version.version}` ? "Uploading…" : "Upload background"}
            </Button>
          </div>
        )}
        {previews && <ThemePreview previews={previews} />}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {!locked && (
          <>
            <Button variant="outline" size="sm" disabled={pending !== null} onClick={onSave}>
              {pending === `save:${version.version}` ? "Saving…" : "Save manifest"}
            </Button>
            <Button size="sm" disabled={pending !== null} onClick={onPublish}>
              {pending === `publish:${version.version}` ? "Publishing…" : "Publish"}
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" disabled={pending !== null} onClick={onPreview}>
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
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-ring"
              style={{ background: p.theme.palette.background, color: p.theme.palette.text }}
            >
              <span className="size-3 rounded-full" style={{ background: p.theme.palette.accent }} aria-hidden />
              {p.palette_id} / {p.font_id}
            </button>
          </li>
        ))}
      </ul>
      <div className="mx-auto h-[640px] w-full max-w-[420px] overflow-y-auto rounded-lg border [container-type:inline-size]">
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
