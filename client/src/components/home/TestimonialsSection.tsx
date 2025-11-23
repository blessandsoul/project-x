import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
}

export function TestimonialsSection() {
  const { t } = useTranslation()
  const [tickerIndex, setTickerIndex] = useState(0)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

            return {
              id: `${review.company_id}-${review.id}`,
              userName,
              avatarUrl,
              rating: review.rating,
              comment: review.comment ?? '',
              companyName,
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

  useEffect(() => {
    if (testimonials.length === 0) {
      return
    }

    const interval = window.setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [testimonials.length])

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
      className="border-b bg-background"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-testimonials-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {t('home.testimonials.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('home.testimonials.description')}
            </p>
          </div>
          {testimonials.length > 0 && (
            <div className="mt-1 hidden md:mt-0 md:block">
              <div className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Icon
                  icon="mdi:flash"
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
                {shouldReduceMotion ? (
                  <p className="whitespace-nowrap" aria-live="polite">
                     {t('home.testimonials.ticker_message', { user: testimonials[tickerIndex].userName, rating: testimonials[tickerIndex].rating, company: testimonials[tickerIndex].companyName })}
                  </p>
                ) : (
                  <motion.p
                    key={testimonials[tickerIndex].id}
                    className="whitespace-nowrap"
                    aria-live="polite"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {t('home.testimonials.ticker_message', { user: testimonials[tickerIndex].userName, rating: testimonials[tickerIndex].rating, company: testimonials[tickerIndex].companyName })}
                  </motion.p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3" role="list">
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
                >
                  <Card className="h-full border-muted/60">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={avatarSrc} alt={item.userName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold">
                            {item.userName}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {item.companyName}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon
                                key={star}
                                icon="mdi:star"
                                className={`h-3 w-3 ${
                                  star <= item.rating
                                    ? 'text-yellow-400'
                                    : 'text-muted-foreground/30'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.comment}</p>
                    </CardContent>
                  </Card>
                </motion.article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
