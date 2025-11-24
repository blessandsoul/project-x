import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'
import { useCompaniesData } from '@/hooks/useCompaniesData'
import { fetchCompanyReviewsFromApi, type ApiCompanyReview } from '@/services/companiesApi'
import { useTranslation } from 'react-i18next'

interface Testimonial {
  id: string
  userName: string
  avatarUrl: string | null
  rating: number
  comment: string
  companyName: string
  // New fields
  purchasedCar?: {
    model: string
    year: number
    image: string
  }
  clientStats?: {
    since: number
    orders: number
  }
}

export function TestimonialsSection() {
  const { t } = useTranslation()
  const [tickerIndex, setTickerIndex] = useState(0)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const { companies, isLoading: isCompaniesLoading, error: companiesError } = useCompaniesData()

  useEffect(() => {
    if (!companies || companies.length === 0 || companiesError) {
      return
    }

    let isCancelled = false

    const loadReviews = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const companiesWithReviews = companies.filter((company) => company.reviewCount && company.reviewCount > 0)

        if (companiesWithReviews.length === 0) {
          if (!isCancelled) {
            setTestimonials([])
          }
          return
        }

        const companiesToLoad = companiesWithReviews.slice(0, 5)

        const responses = await Promise.all(
          companiesToLoad.map(async (company) => {
            try {
              const response = await fetchCompanyReviewsFromApi(company.id, {
                limit: 3,
                offset: 0,
              })

              return {
                companyName: company.name,
                items: Array.isArray(response.items) ? response.items : [],
              }
            } catch {
              return {
                companyName: company.name,
                items: [] as ApiCompanyReview[],
              }
            }
          }),
        )

        if (isCancelled) return

        const allMapped: Testimonial[] = responses.flatMap(({ companyName, items }) => (
          items.map((review: ApiCompanyReview) => {
            const hasCustomName = typeof review.user_name === 'string' && review.user_name.trim().length > 0
            const userName = hasCustomName ? review.user_name!.trim() : `${t('common.user')} #${review.user_id}`

            const hasAvatar = typeof review.avatar === 'string' && review.avatar.trim().length > 0
            const avatarUrl = hasAvatar ? review.avatar!.trim() : null

            // Mock enhanced data
            const mockCars = [
              { model: 'BMW X5', year: 2020, image: '/cars/1.webp' },
              { model: 'Toyota Camry', year: 2019, image: '/cars/2.webp' },
              { model: 'Mercedes C300', year: 2021, image: '/cars/3.webp' },
            ]
            const randomCar = mockCars[Math.floor(Math.random() * mockCars.length)]
            
            const clientStats = {
              since: 2021 + Math.floor(Math.random() * 3),
              orders: 1 + Math.floor(Math.random() * 3)
            }

            return {
              id: `${review.company_id}-${review.id}`,
              userName,
              avatarUrl,
              rating: review.rating,
              comment: review.comment ?? '',
              companyName,
              purchasedCar: Math.random() > 0.3 ? randomCar : undefined,
              clientStats: Math.random() > 0.4 ? clientStats : undefined
            }
          })
        ))

        // Shuffle to get random distinct testimonials
        const shuffled = [...allMapped]
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          const temp = shuffled[i]
          shuffled[i] = shuffled[j]
          shuffled[j] = temp
        }

        setTestimonials(shuffled.slice(0, 6))
      } catch (err) {
        if (!isCancelled) {
          setError(t('home.testimonials.error'))
          setTestimonials([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadReviews()

    return () => {
      isCancelled = true
    }
  }, [companies, companiesError, t])

  const shouldReduceMotion = useReducedMotion()

  const getCardMotionProps = (index: number) => {
    if (shouldReduceMotion) {
      return {}
    }

    const delay = index * 0.06

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: 'easeOut' as const, delay },
    }
  }

  if ((isCompaniesLoading || isLoading) && !error && !companiesError) {
    return null
  }

  if (error || companiesError) {
    return null
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section
      className="border-b bg-muted/20"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="container mx-auto py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-testimonials-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {t('home.testimonials.title')}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {['all', 'speed', 'price', 'quality', 'docs'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted shadow-sm'
                  }`}
                >
                  {t(`home.testimonials.filters.${filter}`)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sentiment Analysis Bar */}
          <div className="hidden md:block">
            <div className="flex items-center gap-6 rounded-xl bg-background p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-green-600">98%</span>
                  <span className="text-muted-foreground">{t('home.testimonials.stats.satisfaction')}</span>
                </div>
                <div className="h-1.5 w-32 rounded-full bg-muted">
                  <div className="h-full w-[98%] rounded-full bg-green-500" />
                </div>
              </div>
               <div className="h-8 w-px bg-border" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-primary">4.9/5</span>
                  <span className="text-muted-foreground">{t('home.testimonials.stats.quality')}</span>
                </div>
                <div className="h-1.5 w-32 rounded-full bg-muted">
                  <div className="h-full w-[95%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3" role="list">
          {testimonials.length === 0 ? (
            <Card className="md:col-span-3 p-8">
              <EmptyState
                icon="mdi:account-off"
                title={t('home.testimonials.empty.title')}
                description={t('home.testimonials.empty.description')}
                action={(
                  <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-1">
                    <Link to="/catalog">
                      <Icon icon="mdi:view-grid" className="me-1 h-4 w-4" aria-hidden="true" />
                      <span>{t('home.testimonials.view_catalog_btn')}</span>
                    </Link>
                  </Button>
                )}
              />
            </Card>
          ) : (
            testimonials.map((item, index) => {
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
        key={item.id}
        {...getCardMotionProps(index)}
        role="listitem"
        className="h-full"
      >
        <div className="flex h-full flex-col justify-between rounded-2xl bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div>
            <div className="mb-6 flex items-start justify-between">
               <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarImage src={avatarSrc} alt={item.userName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  {item.clientStats && (
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background" title={t('home.testimonials.card.orders_count', { count: item.clientStats.orders })}>
                      {item.clientStats.orders}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      {item.userName}
                    </h3>
                    <Icon icon="mdi:check-decagram" className="h-4 w-4 text-primary" aria-label={t('common.verified')} />
                  </div>
                   {item.clientStats ? (
                     <p className="text-[10px] font-medium text-muted-foreground">
                       {t('home.testimonials.card.client_since', { year: item.clientStats.since })}
                     </p>
                   ) : (
                     <p className="text-xs text-muted-foreground">{item.companyName}</p>
                   )}
                </div>
              </div>
               <div className="flex items-center gap-0.5 rounded-full bg-yellow-400/10 px-2 py-1">
                 <span className="text-xs font-bold text-yellow-600">{item.rating.toFixed(1)}</span>
                 <Icon icon="mdi:star" className="h-3 w-3 text-yellow-400" />
               </div>
            </div>

            <blockquote className="relative mb-6">
              <p className="text-sm leading-7 text-muted-foreground">
                "{item.comment}"
              </p>
            </blockquote>
          </div>
          
          {item.purchasedCar && (
            <div className="mt-auto rounded-xl border border-border/50 bg-muted/30 p-3">
               <div className="flex items-center gap-3">
                 <div className="relative h-10 w-14 overflow-hidden rounded-md bg-muted">
                   <img src={item.purchasedCar.image} alt={item.purchasedCar.model} className="h-full w-full object-cover" />
                 </div>
                 <div>
                   <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('home.testimonials.card.bought')}</div>
                   <div className="text-sm font-semibold text-foreground">
                     {item.purchasedCar.year} {item.purchasedCar.model}
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </motion.article>
    )
  })
          )}
        </div>
      </div>
    </section>
  )
}
