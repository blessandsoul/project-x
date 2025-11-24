import { Icon } from '@iconify/react/dist/iconify.js'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
  className?: string
  label?: string
  variant?: 'diamond' | 'gold' | 'silver' | 'default'
}

export function VipBadge({ className, label, variant = 'default' }: VipBadgeProps) {
  const variants = {
    diamond: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-400/40',
    gold: 'bg-amber-100 text-amber-800 ring-1 ring-amber-400/40',
    silver: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300/50',
    default: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40'
  }

  const displayLabel = label ?? 'VIP'
  const icon = variant === 'diamond' ? 'mdi:diamond-stone' : 'mdi:crown'

  return (
    <Badge
      className={cn(
        'text-xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm',
        variants[variant] || variants.default,
        className,
      )}
    >
      <Icon icon={icon} className="h-3 w-3" />
      {displayLabel}
    </Badge>
  )
}
