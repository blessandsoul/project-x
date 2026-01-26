import { Icon } from '@iconify/react/dist/iconify.js'
import { cn, formatRating } from '@/lib/utils'

interface CompanyRatingProps {
  rating: number
  size?: 'sm' | 'md'
  className?: string
  showValue?: boolean
}

export function CompanyRating({ rating, size = 'sm', className, showValue = true }: CompanyRatingProps) {
  const iconSizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  const textSizeClass = size === 'md' ? 'text-lg' : 'text-sm'
  const formattedRating = formatRating(rating)

  return (
    <div className={cn('flex items-center', className)}>
      <Icon icon="mdi:star" className={cn(iconSizeClass, 'text-warning fill-current')} />
      {showValue && (
        <span className={cn(textSizeClass, 'font-semibold ml-1')}>{formattedRating}</span>
      )}
    </div>
  )
}
