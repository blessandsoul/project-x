import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@iconify/react/dist/iconify.js'
import type { Testimonial } from './types'
import { useTranslation } from 'react-i18next'

interface TestimonialCardProps {
  item: Testimonial
  index: number
}

export function TestimonialCard({ item, index }: TestimonialCardProps) {
  const { t } = useTranslation()
  
  const avatarImages = [
    '/avatars/user.jpg',
    '/avatars/dealer.jpg',
    '/avatars/0450249b131eec36dc8333b7cf847bc4.webp',
  ]
  
  const avatarSrc = item.avatarUrl && item.avatarUrl.trim().length > 0
    ? item.avatarUrl
    : avatarImages[index % avatarImages.length]

  const initials = item.userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex h-full flex-col justify-between rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={avatarSrc} alt={item.userName} className="object-cover" loading="lazy" />
            <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{item.userName}</span>
              <Icon 
                icon="mdi:check-decagram" 
                className="h-3.5 w-3.5 text-primary" 
                aria-label={t('common.verified')} 
              />
            </div>
            {item.clientStats ? (
              <span className="text-[10px] text-muted-foreground">
                {t('home.testimonials.card.client_since', { year: item.clientStats.since })}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{item.companyName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 rounded-md bg-yellow-400/10 px-1.5 py-0.5">
          <span className="text-xs font-bold text-yellow-600">{item.rating.toFixed(1)}</span>
          <Icon icon="mdi:star" className="h-3 w-3 text-yellow-400" />
        </div>
      </div>

      {/* Content */}
      <blockquote className="mb-4 grow">
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
          "{item.comment}"
        </p>
      </blockquote>

      {/* Footer: Purchased Car (Compact) */}
      {item.purchasedCar && (
        <div className="mt-auto flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-xs transition-colors group-hover:bg-muted/50">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
            <Icon icon="mdi:car-hatchback" className="h-3 w-3 text-primary" />
          </div>
          <span className="font-medium text-muted-foreground">
            {t('home.testimonials.card.bought')}: <span className="text-foreground">{item.purchasedCar.year} {item.purchasedCar.model}</span>
          </span>
        </div>
      )}
    </motion.article>
  )
}
