import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyRating } from '@/components/company/CompanyRating'
import { VipBadge } from '@/components/company/VipBadge'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Company } from '@/types/api'

type VipTier = 'diamond' | 'gold' | 'silver'

type FeaturedCompaniesSectionProps = {
  companies: Company[]
  isLoading: boolean
}

export function FeaturedCompaniesSection({
  companies,
  isLoading,
}: FeaturedCompaniesSectionProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const vipCompanies = useMemo<Company[]>(() => {
    if (!companies || companies.length === 0) {
      return []
    }

    const vips = companies.filter((company) => company.vipStatus)
    if (vips.length > 0) {
      return [...vips].sort((a, b) => b.rating - a.rating).slice(0, 3)
    }

    return [...companies].sort((a, b) => b.rating - a.rating).slice(0, 3)
  }, [companies])

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))
    }

    if (vipCompanies.length === 0) {
      return (
        <Card className="md:col-span-3 p-8">
          <EmptyState
            icon="mdi:magnify-remove"
            title={t('home.featured_companies.empty_title')}
            description={t('home.featured_companies.empty_desc')}
            action={null}
          />
        </Card>
      )
    }

    const tiers: VipTier[] = ['diamond', 'gold', 'silver']

    const tieredCompanies = vipCompanies.slice(0, 3).map((company, index) => ({
      company,
      tier: tiers[index] ?? 'silver',
    }))

    return tieredCompanies.map(({ company, tier }) => {
      const tierClassName = (() => {
        if (tier === 'diamond') {
          return 'border-2 border-cyan-500/70 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-sm shadow-cyan-100/70'
        }

        if (tier === 'gold') {
          return 'border-2 border-amber-500/70 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm shadow-amber-100/70'
        }

        if (tier === 'silver') {
          return 'border-2 border-slate-300/80 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm shadow-slate-200/70'
        }

        return ''
      })()

      const vipLabel = (() => {
        if (!company.vipStatus) {
          return 'VIP'
        }

        if (tier === 'diamond') {
          return t('home.featured_companies.vip_diamond')
        }

        if (tier === 'gold') {
          return t('home.featured_companies.vip_gold')
        }

        if (tier === 'silver') {
          return t('home.featured_companies.vip_silver')
        }

        return 'VIP'
      })()

      return (
        <Card
          key={company.id}
          className={`h-full cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${tierClassName}`}
          onClick={() => navigate(`/company/${company.id}`)}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2 md:gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground overflow-hidden min-w-0">
                <CardTitle className="text-base font-semibold text-foreground">
                  {company.name}
                </CardTitle>
                {tier === 'diamond' && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Icon
                      icon="mdi:diamond-stone"
                      className="h-3 w-3"
                      aria-hidden="true"
                    />
                    <span>{t('home.featured_companies.top_partner')}</span>
                  </div>
                )}
                {company.vipStatus && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                    {vipLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Icon icon="mdi:map-marker" className="h-3 w-3" />
                  <span>
                    {company.location.city}, {company.location.state}
                  </span>
                </span>
              </div>
            </div>
            {company.vipStatus && <VipBadge />}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CompanyRating rating={company.rating} />
              <span className="text-xs text-muted-foreground">
                ({company.reviewCount} {t('common.reviews')})
              </span>
            </div>
            <p
              className={`${
                company.vipStatus ? '' : 'line-clamp-1 '
              }text-xs text-muted-foreground`}
            >
              {company.description}
            </p>
            <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <Icon icon="mdi:car-arrow-right" className="h-3 w-3" aria-hidden="true" />
                <span>{t('home.featured_companies.full_cycle')}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <Icon icon="mdi:file-document-outline" className="h-3 w-3" aria-hidden="true" />
                <span>{t('home.featured_companies.docs_customs')}</span>
              </span>
            </div>
            <div className="mt-2 border-t border-muted/40 pt-2 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Icon icon="mdi:cash" className="h-4 w-4 text-primary" />
                <span>
                  ${company.priceRange.min} - ${company.priceRange.max}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground flex-wrap">
                {(() => {
                  const estimatedDeals = company.reviewCount * 3
                  const satisfaction = Math.round((company.rating / 5) * 100)

                  let avgResponseHours = 6
                  if (company.rating >= 4.5) {
                    avgResponseHours = 1
                  } else if (company.rating >= 4) {
                    avgResponseHours = 3
                  }

                  return (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex min-w-[90px] flex-1 items-center gap-1 rounded-full bg-primary/5 px-2 py-1 cursor-help">
                            <Icon
                              icon="mdi:handshake-outline"
                              className="h-3.5 w-3.5 text-primary"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-[11px]">
                              {estimatedDeals}
                            </span>
                            <span className="truncate">
                              {t('home.featured_companies.deals')}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-xs text-[11px]">
                          <p>
                            {t('home.featured_companies.deals_tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex min-w-[90px] flex-1 items-center gap-1 rounded-full bg-primary/5 px-2 py-1 cursor-help">
                            <Icon
                              icon="mdi:emoticon-happy-outline"
                              className="h-3.5 w-3.5 text-primary"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-[11px]">
                              {satisfaction}%
                            </span>
                            <span className="truncate">
                              {t('home.featured_companies.satisfaction')}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="max-w-xs text-[11px]">
                          <p>
                            {t('home.featured_companies.satisfaction_tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )
                })()}
              </div>
            </div>
            {company.contact.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon="mdi:phone" className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{company.contact.phone}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon icon="mdi:calendar" className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('home.featured_companies.established', { year: company.establishedYear })}</span>
              </div>
              {(() => {
                let avgResponseHours = 6
                if (company.rating >= 4.5) {
                  avgResponseHours = 1
                } else if (company.rating >= 4) {
                  avgResponseHours = 3
                }

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 cursor-help">
                        <Icon
                          icon="mdi:clock-outline"
                          className="h-3.5 w-3.5 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-[11px]">
                          {t('home.featured_companies.response_time', { hours: avgResponseHours })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end" className="max-w-xs text-[11px]">
                      <p>
                        {t('home.featured_companies.avg_response_time_tooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })()}
            </div>
            {company.vipStatus && (
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                {company.services.slice(0, 3).map((service: string) => (
                  <span
                    key={service}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary"
                  >
                    <Icon
                      icon="mdi:star-circle"
                      className="mr-1 h-3 w-3"
                      aria-hidden="true"
                    />
                    {service}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )
    })
  }

  return (
    <section
      className="border-b bg-background"
      id="home-featured-companies-section"
      aria-labelledby="home-featured-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-featured-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {t('home.featured_companies.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('home.featured_companies.description')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/catalog')}>
            <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
            {t('home.featured_companies.view_all')}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {renderContent()}
        </div>
      </div>
    </section>
  )
}
