import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'
import { useCompaniesData } from '@/hooks/useCompaniesData'
import { fetchCompanyReviewsFromApi, type ApiCompanyReview } from '@/services/companiesApi'
import { useTranslation } from 'react-i18next'
import { TestimonialCard } from './TestimonialCard'
import { StatsWidget } from './StatsWidget'
import type { Testimonial } from './types'

export function TestimonialsSection() {
  const { t } = useTranslation()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [_activeFilter, _setActiveFilter] = useState('all')

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

  if ((isCompaniesLoading || isLoading) && !error && !companiesError) {
    return null // Or a skeleton loader if preferred, but keeping null as per original
  }

  if (error || companiesError) {
    return null
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section
      className="border-b bg-muted/10 py-16 md:py-24"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <h2
              id="home-testimonials-heading"
              className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl"
            >
              {t('home.testimonials.title')}
            </h2>
            {/* <div className="flex flex-wrap gap-2">
              {['all', 'speed', 'price', 'quality', 'docs'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeFilter === filter
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground'
                  }`}
                  aria-pressed={activeFilter === filter}
                >
                  {t(`home.testimonials.filters.${filter}`)}
                </button>
              ))}
            </div> */}
          </div>
          
          <StatsWidget />
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {testimonials.length === 0 ? (
            <Card className="col-span-full p-8 text-center">
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
            testimonials.map((item, index) => (
              <TestimonialCard key={item.id} item={item} index={index} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
