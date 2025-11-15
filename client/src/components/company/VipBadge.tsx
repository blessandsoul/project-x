import { Icon } from '@iconify/react/dist/iconify.js'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
  label?: string
  className?: string
}

export function VipBadge({ label = 'VIP', className }: VipBadgeProps) {
  const normalized = label.toLowerCase()

  const vipClassName = (() => {
    if (normalized.includes('diamond')) {
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-400/40 animate-pulse'
    }

    if (normalized.includes('gold')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/40 animate-pulse'
    }

    if (normalized.includes('silver')) {
      return 'bg-slate-400/10 text-slate-600 dark:text-slate-200 ring-1 ring-slate-300/40'
    }

    return 'bg-warning/10 text-warning'
  })()

  return (
    <Badge
      className={cn(
        'text-xs font-semibold uppercase tracking-wide rounded-full px-2 py-1 flex items-center gap-1',
        vipClassName,
        className,
      )}
    >
      <Icon icon="mdi:crown" className="h-3 w-3" />
      {label}
    </Badge>
  )
}
