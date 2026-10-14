"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { nowLocalInput } from "@/lib/local-time";

/**
 * A `datetime-local` field that can't end up in the past. The native `min` only greys out earlier days; the
 * time picker still offers earlier times today, so a choice (or typed value) before the earliest allowed
 * moment is snapped to it when the field loses focus, with a short note. It's checked on blur, not on every
 * change, because typing a year emits values like 0002 on the way to 2027. A value the user never touched
 * (an existing event whose date has passed) is left alone.
 *
 * "Now" is read on the wall clock of `timeZone`; `notBefore` raises the limit further (an end after its start).
 */
export function FutureDateTimeInput({
  value,
  onValueChange,
  timeZone,
  notBefore,
  onBlur,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "min"> & {
  value: string;
  onValueChange: (value: string) => void;
  timeZone?: string;
  notBefore?: string;
}) {
  const noteId = useId();
  const touched = useRef(false);
  const [snapped, setSnapped] = useState(false);

  const now = nowLocalInput(timeZone);
  const min = notBefore && notBefore > now ? notBefore : now;

  return (
    <>
      <Input
        {...props}
        type="datetime-local"
        value={value}
        min={min}
        aria-describedby={snapped ? noteId : props["aria-describedby"]}
        suppressHydrationWarning // `min` is the current time, which differs between server and browser
        onChange={(e) => {
          touched.current = true;
          setSnapped(false);
          onValueChange(e.target.value);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          const earliest = notBefore && notBefore > nowLocalInput(timeZone) ? notBefore : nowLocalInput(timeZone);
          if (touched.current && value && value < earliest) {
            onValueChange(earliest);
            setSnapped(true);
          }
        }}
      />
      {snapped && (
        <p id={noteId} role="status" className="text-sm text-muted-foreground">
          That time has already passed, so we set the earliest time available.
        </p>
      )}
    </>
  );
}
