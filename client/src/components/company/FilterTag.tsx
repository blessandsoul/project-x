import type { KeyboardEvent, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FilterTagProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function FilterTag({ children, className, onClick }: FilterTagProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-primary/5 text-primary border-primary/30 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </Badge>
  )
}
