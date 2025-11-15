import type { ReactNode } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center gap-4', className)}>
      <Icon icon={icon} className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
