import * as React from "react"

import { cn } from "cn"

import { Logo } from "./logo"

/** Dashed ivory panel with the doorway mark: for lists with nothing in them yet. */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 rounded-3xl border border-dashed border-input bg-card px-5 py-10 text-center",
        className,
      )}
    >
      <Logo variant="mark" title="" className="mb-1 size-12 text-brand-heading" />
      <h2 className="font-heading text-2xl text-brand-heading">{title}</h2>
      {children && <p className="max-w-[38ch] text-muted-foreground">{children}</p>}
      {action}
    </div>
  )
}
