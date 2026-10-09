"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type SlugBlocklistEntry, type SlugBlocklistResponse } from "@/lib/api";

export function SlugBlocklist({
  initialTerms,
  initialCursor,
}: {
  initialTerms: SlugBlocklistEntry[];
  initialCursor: string | null;
}) {
  const [terms, setTerms] = useState(initialTerms);
  const [cursor, setCursor] = useState(initialCursor);
  const [term, setTerm] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const res = await api<SlugBlocklistResponse>(
        `/v1/admin/slug-blocklist?cursor=${encodeURIComponent(cursor)}`,
      );
      setTerms((prev) => [...prev, ...res.terms]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    setPending("add");
    setError(null);
    try {
      const normalized = term.trim().toLowerCase();
      await api("/v1/admin/slug-blocklist", { method: "POST", json: { term: normalized, reason } });
      setTerms((prev) => [...prev, { term: normalized, reason }].sort((a, b) => a.term.localeCompare(b.term)));
      setTerm("");
      setReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function remove(t: string) {
    setPending(t);
    setError(null);
    try {
      await api(`/v1/admin/slug-blocklist/${encodeURIComponent(t)}`, { method: "DELETE" });
      setTerms((prev) => prev.filter((e) => e.term !== t));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="term">Term</Label>
          <Input
            id="term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            pattern="[a-z0-9-]{2,50}"
            required
            className="w-40"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required className="w-56" />
        </div>
        <Button type="submit" disabled={pending !== null}>
          {pending === "add" ? "Adding…" : "Add"}
        </Button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blocked terms yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.term}>
                <TableCell className="font-mono">{t.term}</TableCell>
                <TableCell className="text-muted-foreground">{t.reason}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => remove(t.term)}>
                    {pending === t.term ? "Removing…" : "Remove"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {cursor && (
        <Button variant="outline" className="self-start" disabled={pending !== null} onClick={loadMore}>
          {pending === "more" ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
