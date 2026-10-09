import * as React from "react"
import { cn } from "cn"

/**
 * Platform `<select>` styled like `Input`. Use for long option lists (time
 * zones) and filter bars where the OS picker is the better experience.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-11.5 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-(--duration-fast) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
