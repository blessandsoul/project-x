import { Icon } from '@iconify/react/dist/iconify.js'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
  className?: string
}

export function VipBadge({ className }: VipBadgeProps) {
  const vipClassName = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40'

  const displayLabel = 'VIP'

  return (
    <Badge
      className={cn(
        'text-xs font-semibold uppercase tracking-wide rounded-full px-2 py-1 flex items-center gap-1',
        vipClassName,
        className,
      )}
    >
      <Icon icon="mdi:crown" className="h-3 w-3" />
      {displayLabel}
    </Badge>
  )
}
