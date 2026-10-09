import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-card px-3.5 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-(--duration-fast) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/24 placeholder:text-brand-placeholder disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
