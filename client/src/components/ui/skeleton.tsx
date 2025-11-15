import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gradient-to-r from-muted via-muted/70 to-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
