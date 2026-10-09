"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MediaMap, MediaRef, PeopleBlock, Person } from "@/lib/api-types";

import { Field, KickerField } from "./block-form";
import { emptyPerson } from "./blocks";
import { MediaField } from "./media-field";

const MAX_PEOPLE = 6;

/**
 * Editor form for the `people` block (build-out plan rich-blocks §6.7).
 * Repeatable person rows follow the same add/remove/reorder pattern as
 * `ScheduleForm`; the server (`internal/content`) enforces the same limits
 * independently, this is a courtesy for immediate feedback.
 */
export function PeopleForm({
  block,
  onChange,
  eventId,
  media,
  onMediaUploaded,
}: {
  block: PeopleBlock;
  onChange: (patch: Partial<PeopleBlock>) => void;
  eventId: string;
  media: MediaMap;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  function updatePerson(index: number, patch: Partial<Person>) {
    onChange({ people: block.people.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= block.people.length) return;
    const next = [...block.people];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ people: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="people" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="people-heading">
        <Input id="people-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>

      <div className="flex flex-col gap-3">
        {block.people.map((person, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Person {i + 1}</p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={i === block.people.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this person"
                  disabled={block.people.length <= 1}
                  onClick={() => onChange({ people: block.people.filter((_, idx) => idx !== i) })}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>

            <Field label="Name" htmlFor={`people-${i}-name`}>
              <Input
                id={`people-${i}-name`}
                required
                maxLength={80}
                value={person.name}
                onChange={(e) => updatePerson(i, { name: e.target.value })}
              />
            </Field>
            <Field label="Role" htmlFor={`people-${i}-role`}>
              <Input
                id={`people-${i}-role`}
                maxLength={60}
                placeholder="The groom, Guest of honour, Birthday girl…"
                value={person.role}
                onChange={(e) => updatePerson(i, { role: e.target.value })}
              />
            </Field>

            <div className="grid gap-1.5">
              <p className="text-sm font-medium">Photo</p>
              <MediaField
                eventId={eventId}
                preview={person.photo ? media[person.photo.media_id] ?? null : null}
                onUploaded={(id, ref) => {
                  onMediaUploaded(id, ref);
                  updatePerson(i, { photo: { media_id: id, alt: person.photo?.alt ?? "" } });
                }}
              />
              {person.photo && (
                <>
                  <Input
                    placeholder="Describe the photo (for screen readers)"
                    maxLength={200}
                    value={person.photo.alt}
                    onChange={(e) => updatePerson(i, { photo: { media_id: person.photo!.media_id, alt: e.target.value } })}
                  />
                  <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => updatePerson(i, { photo: null })}>
                    Remove photo
                  </Button>
                </>
              )}
            </div>

            <Field label="Family label" htmlFor={`people-${i}-family-label`}>
              <Input
                id={`people-${i}-family-label`}
                maxLength={40}
                placeholder="Son of, Proud parents…"
                value={person.family_label}
                onChange={(e) => updatePerson(i, { family_label: e.target.value })}
              />
            </Field>
            <Field label="Family names" htmlFor={`people-${i}-family-names`}>
              <Input
                id={`people-${i}-family-names`}
                maxLength={160}
                placeholder="Mr Rajan & Mrs Latha"
                value={person.family_names}
                onChange={(e) => updatePerson(i, { family_names: e.target.value })}
              />
            </Field>
            <Field label="Place" htmlFor={`people-${i}-place`}>
              <Input
                id={`people-${i}-place`}
                maxLength={120}
                placeholder="Hometown, city…"
                value={person.place}
                onChange={(e) => updatePerson(i, { place: e.target.value })}
              />
            </Field>
            <Field label="Bio" htmlFor={`people-${i}-bio`}>
              <Textarea
                id={`people-${i}-bio`}
                maxLength={300}
                rows={3}
                value={person.bio}
                onChange={(e) => updatePerson(i, { bio: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={block.people.length >= MAX_PEOPLE}
        onClick={() => onChange({ people: [...block.people, emptyPerson()] })}
      >
        <PlusIcon data-icon="inline-start" />
        Add person
      </Button>
    </div>
  );
}
