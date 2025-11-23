import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import type { CompanyStats } from '@/hooks/useCompanyStats'
import type { Company } from '@/types/api'
import { trackHeroCtaClick } from '@/lib/homePageEvents'

type HeroSectionProps = {
  stats: CompanyStats
  companies: Company[]
}

const ANIMATION_DURATION_MS = 800

function useAnimatedNumber(value: number, shouldAnimate: boolean, durationMs = ANIMATION_DURATION_MS): number {
  const [displayValue, setDisplayValue] = useState<number>(() => (shouldAnimate ? 0 : value))

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value)

      return
    }

    let frameId: number | null = null
    const startValue = 0
    const delta = value - startValue
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const nextValue = startValue + delta * progress

      // Keep a single decimal place for smoother UI and to avoid long fractional values
      const roundedToTenth = Math.round(nextValue * 10) / 10
      setDisplayValue(roundedToTenth)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [durationMs, shouldAnimate, value])

  return displayValue
}

export function HeroSection({ stats, companies }: HeroSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const estimatedDeals = Math.max(stats.total * 10, 20)
  const activeCompanyViewers = 15
  const activeVehicleViewers = 12

  const animationEnabled = !shouldReduceMotion

  const animatedTotalCompanies = useAnimatedNumber(stats.total, animationEnabled)
  const animatedVipCompanies = useAnimatedNumber(stats.vip, animationEnabled)
  const animatedAvgRating = useAnimatedNumber(stats.avgRating, animationEnabled)
  const animatedCompanyViewers = useAnimatedNumber(activeCompanyViewers, animationEnabled)
  const animatedVehicleViewers = useAnimatedNumber(activeVehicleViewers, animationEnabled)
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState<number>(0)
  const vehicleTypes = ['cars', 'motorcycles', 'atvs'] as const
  const [currentVehicleTypeIndex, setCurrentVehicleTypeIndex] = useState<number>(0)

  useEffect(() => {
    if (shouldReduceMotion) return
    if (!companies || companies.length === 0) return

    const limitedCompanies = companies.slice(0, 12)
    if (limitedCompanies.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentCompanyIndex((prevIndex) => {
        const total = limitedCompanies.length
        if (total === 0) return 0

        const step = 2
        const nextIndex = (prevIndex + step) % total

        return nextIndex
      })
    }, 3500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [companies, shouldReduceMotion])

  useEffect(() => {
    if (shouldReduceMotion) {
      return
    }

    if (vehicleTypes.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentVehicleTypeIndex((prevIndex) => {
        const nextIndex = prevIndex + 1

        if (nextIndex >= vehicleTypes.length) {
          return 0
        }

        return nextIndex
      })
    }, 2600)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [shouldReduceMotion, vehicleTypes.length])

  const scrollToSection = (sectionId: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const target = document.getElementById(sectionId)
    if (!target) return

    const rect = target.getBoundingClientRect()
    const viewportHeight = window.innerHeight || 0
    const targetHeight = rect.height || 0

    const absoluteTop = window.scrollY + rect.top
    const desiredTop = absoluteTop - (viewportHeight / 2 - targetHeight / 2)

    window.scrollTo({
      top: Math.max(desiredTop, 0),
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-hero-heading"
    >
      <div className="container mx-auto py-4 md:py-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <motion.div
            className="space-y-6"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon icon="mdi:shield-check" className="me-1 h-3 w-3" />
              {t('home.hero.badge')}
            </div>
            <div className="space-y-4">
              <h1
                id="home-hero-heading"
                className="pt-1 text-3xl font-bold tracking-tight md:text-5xl leading-[1.25]"
              >
                <span className="sr-only">{t('home.hero.title_prefix')} {t('home.hero.title_suffix')}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex flex-wrap items-baseline gap-1 bg-gradient-to-r from-[#FF8A00] to-[#FF4B00] bg-clip-text text-transparent"
                >
                  <span>{t('home.hero.title_prefix')}</span>
                  <span className="relative inline-flex h-[2.1em] min-w-[13ch] items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={vehicleTypes[currentVehicleTypeIndex]}
                        initial={{ y: '60%', opacity: 0, scale: 0.96 }}
                        animate={{ y: '0%', opacity: 1, scale: 1 }}
                        exit={{ y: '-60%', opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="inline-block whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-primary"
                      >
                        {t(`home.hero.vehicle_types.${vehicleTypes[currentVehicleTypeIndex]}`)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span>{t('home.hero.title_suffix')}</span>
                </span>
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                {t('home.hero.description')}
              </p>
              <div className="mt-2 space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t('home.hero.how_it_works_title')}
                </p>
                <ol className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-price-calculator-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        1
                      </span>
                      <span>{t('home.hero.step1')}</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-ready-scenarios-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        2
                      </span>
                      <span>{t('home.hero.step2')}</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-featured-companies-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        3
                      </span>
                      <span>{t('home.hero.step3')}</span>
                    </button>
                  </li>
                </ol>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => {
                  trackHeroCtaClick('catalog')
                  navigate('/catalog')
                }}
              >
                <Icon icon="mdi:magnify" className="me-2 h-4 w-4" />
                {t('home.hero.cta_find')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  trackHeroCtaClick('auction-listings')
                  navigate('/auction-listings')
                }}
              >
                <Icon icon="mdi:view-grid" className="me-2 h-4 w-4" />
                აუქციონების ნახვა
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('home.hero.promise')}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:check-circle"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>{t('home.hero.verified')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:cash"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>{t('home.hero.transparent')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:account-voice"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>{t('home.hero.support')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center md:justify-end"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' as const, delay: 0.08 }}
          >
            <Card className="w-full max-w-sm border-primary/20 bg-background/80 shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs text-muted-foreground font-logo-bebas inline-flex items-baseline gap-1">
                      <span className="font-bold">Trusted</span>{' '}
                      <span className="font-normal">Importers.Ge</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({estimatedDeals}+ {t('home.hero.card.successful_imports')})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-primary">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5">
                      <Icon
                        icon="mdi:shield-check-outline"
                        className="me-1 h-3 w-3"
                        aria-hidden="true"
                      />
                      <span>{t('home.hero.card.buyer_protection')}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5">
                      <Icon
                        icon="mdi:check-decagram"
                        className="me-1 h-3 w-3"
                        aria-hidden="true"
                      />
                      <span>{t('home.hero.verified')}</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t('home.hero.card.stats_title')}
                </p>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold">
                      {animatedTotalCompanies}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('home.hero.card.company')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {animatedVipCompanies}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('home.hero.card.vip_importer')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {animatedAvgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('home.hero.card.avg_rating')}
                    </div>
                  </div>
                </div>
                {companies && companies.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {t('home.hero.card.examples_title')}
                    </p>
                    <div className="overflow-hidden">
                      {(() => {
                        const limitedCompanies = companies.slice(0, 12)
                        const totalVisible = limitedCompanies.length
                        const visibleCount = 2

                        if (totalVisible === 0) {
                          return null
                        }

                        if (totalVisible <= visibleCount || shouldReduceMotion) {
                          const staticItems = limitedCompanies.slice(0, visibleCount)

                          return (
                            <div className="flex gap-2">
                              {staticItems.map((company) => (
                                <button
                                  key={company.id}
                                  type="button"
                                  onClick={() => navigate(`/company/${company.id}`)}
                                  className="flex min-w-[140px] flex-shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                  <div className="h-6 w-6 overflow-hidden rounded-full border bg-background">
                                    <img
                                      src={company.logo ?? ''}
                                      alt={company.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="text-[11px]">
                                    <div className="max-w-[120px] truncate font-semibold">
                                      {company.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {company.location?.city ?? ''}
                                      {company.location?.city && company.location?.state ? ', ' : ''}
                                      {company.location?.state ?? ''}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )
                        }

                        const items = []
                        const maxVisible = Math.min(visibleCount, totalVisible)

                        for (let i = 0; i < maxVisible; i += 1) {
                          const index = (currentCompanyIndex + i) % totalVisible
                          const company = limitedCompanies[index]

                          items.push(
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => navigate(`/company/${company.id}`)}
                              className="flex min-w-[140px] flex-shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                              <div className="h-6 w-6 overflow-hidden rounded-full border bg-background">
                                <img
                                  src={company.logo ?? ''}
                                  alt={company.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="text-[11px]">
                                <div className="max-w-[120px] truncate font-semibold">
                                  {company.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {company.location?.city ?? ""}
                                  {company.location?.city && company.location?.state ? ", " : ""}
                                  {company.location?.state ?? ""}
                                </div>
                              </div>
                            </button>,
                          )
                        }

                        return (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentCompanyIndex}
                              initial={{ x: 16, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: -16, opacity: 0 }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className="flex gap-2"
                            >
                              {items}
                            </motion.div>
                          </AnimatePresence>
                        )
                      })()}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {t('home.hero.card.data_source')}
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:eye"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <p>
                      {t('home.hero.card.viewing_companies', { count: animatedCompanyViewers })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:car"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <p>
                      {t('home.hero.card.viewing_vehicles', { count: animatedVehicleViewers })}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-muted/50 bg-background p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Icon
                      icon="mdi:information-outline"
                      className="mt-0.5 h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
