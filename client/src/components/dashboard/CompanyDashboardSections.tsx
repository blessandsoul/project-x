import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'

function useAnimatedValue(target: number, durationMs = 600): number {
  const shouldReduceMotion = useReducedMotion()
  const [value, setValue] = useState<number>(() => (shouldReduceMotion ? target : 0))

  useEffect(() => {
    if (shouldReduceMotion) {
      setValue(target)
      return
    }

    let frameId: number | null = null
    const startValue = 0
    const delta = target - startValue
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const nextValue = startValue + delta * progress

      setValue(Math.round(nextValue * 10) / 10)

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
  }, [durationMs, shouldReduceMotion, target])

  return value
}

type CompanyNetworkStats = {
  totalProfileViews: number
  dealersCount: number
  activeCompaniesCount: number
}

type CompanyDealerActivityItem = {
  state: string
  leads: number
}

type CompanyBrandHealth = {
  averageRating: number
  totalReviews: number
}

type CompanyServiceQuality = {
  avgReplyMinutes: number
  handledPercent: number
}

type CompanyCampaign = {
  id: string
  name: string
  impressions: number
  clicks: number
  leads: number
}

type CompanyAudienceSegment = {
  id: string
  label: string
  sharePercent: number
}

type CompanyCompetitor = {
  id: string
  name: string
  rating: number
  trend: 'up' | 'down'
}

type CompanyAlert = {
  id: string
  text: string
  type: 'rating' | 'leads'
}

type CompanyNetworkAction = {
  id: string
  label: string
  icon: string
}

type CompanyGoal = {
  id: string
  label: string
  progressPercent: number
}

export type CompanyLeadBubble = {
  id: string
  leadId: number
  status: 'NEW' | 'OFFER_SENT' | 'WON' | 'LOST' | 'EXPIRED'
  invitedAt: string
  expiresAt: string | null
  priority: 'price' | 'speed' | 'premium_service' | null
  vehicle: {
    id: string | number
    title: string
    year: number
    imageUrl: string
  }
  summary: {
    budgetUsdMin: number | null
    budgetUsdMax: number | null
    desiredDurationDays: number | null
    maxAcceptableDurationDays: number | null
  }
}

type CompanyDashboardSectionsProps = {
  companyLeads: CompanyLeadBubble[]
  companyNetworkStats: CompanyNetworkStats
  companyDealerActivityByState: CompanyDealerActivityItem[]
  companyBrandHealth: CompanyBrandHealth
  companyServiceQuality: CompanyServiceQuality
  companyCampaigns: CompanyCampaign[]
  companyAudienceSegments: CompanyAudienceSegment[]
  companyCompetitors: CompanyCompetitor[]
  companyAlerts: CompanyAlert[]
  companyNetworkActions: CompanyNetworkAction[]
  companyGoals: CompanyGoal[]
  getSectionMotionProps: (index: number) => Record<string, unknown>
}

export function CompanyDashboardSections({
  companyLeads,
  companyNetworkStats,
  companyDealerActivityByState,
  companyBrandHealth,
  companyServiceQuality,
  companyCampaigns,
  companyAudienceSegments,
  companyCompetitors,
  companyAlerts,
  companyNetworkActions,
  companyGoals,
  getSectionMotionProps,
}: CompanyDashboardSectionsProps) {
  const { t } = useTranslation()
  const animatedTotalProfileViews = useAnimatedValue(companyNetworkStats.totalProfileViews)
  const animatedDealersCount = useAnimatedValue(companyNetworkStats.dealersCount)
  const animatedActiveCompanies = useAnimatedValue(companyNetworkStats.activeCompaniesCount)

  const animatedAvgReplyMinutes = useAnimatedValue(companyServiceQuality.avgReplyMinutes)
  const animatedHandledPercent = useAnimatedValue(companyServiceQuality.handledPercent)

  const newLeadsCount = useMemo(
    () => companyLeads.filter((lead) => lead.status === 'NEW').length,
    [companyLeads],
  )

  const formatExpiresIn = (expiresAt: string | null): string | null => {
    if (!expiresAt) return null

    const expiresDate = new Date(expiresAt)
    const now = new Date()
    const diffMs = expiresDate.getTime() - now.getTime()

    if (Number.isNaN(diffMs)) return null

    if (diffMs <= 0) {
      return t('dashboard.company.leads_bubble.expired')
    }

    const diffMinutesTotal = Math.floor(diffMs / (60 * 1000))
    const hours = Math.floor(diffMinutesTotal / 60)
    const minutes = diffMinutesTotal % 60

    if (hours <= 0) {
      return t('dashboard.company.leads_bubble.minutes_left', { count: minutes })
    }

    return t('dashboard.company.leads_bubble.hours_left', { hours, minutes })
  }

  return (
    <>
      <motion.div
        {...getSectionMotionProps(0)}
        role="region"
        aria-label="Company incoming leads"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:inbox-arrow-down" className="h-5 w-5" />
                {t('dashboard.company.leads_bubble.title')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.company.leads_bubble.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {newLeadsCount > 0 && (
                <div
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  aria-live="polite"
                >
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>{newLeadsCount}</span>
                  <span>NEW</span>
                </div>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <Link to="/company/leads">
                  <span className="inline-flex items-center gap-1">
                    <span>{t('common.view_all')}</span>
                    <Icon icon="mdi:arrow-right" className="h-3 w-3" />
                  </span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {companyLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.company.leads_bubble.empty')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {companyLeads.slice(0, 5).map((lead) => {
                  const statusLabelMap: Record<CompanyLeadBubble['status'], string> = {
                    NEW: t('dashboard.company.leads_bubble.status.new'),
                    OFFER_SENT: t('dashboard.company.leads_bubble.status.offer_sent'),
                    WON: t('dashboard.company.leads_bubble.status.won'),
                    LOST: t('dashboard.company.leads_bubble.status.lost'),
                    EXPIRED: t('dashboard.company.leads_bubble.status.expired'),
                  }

                  const statusLabel = statusLabelMap[lead.status]

                  const expiresLabel = formatExpiresIn(lead.expiresAt)

                  return (
                    <Link
                      key={lead.id}
                      to={`/company/leads/${lead.id}`}
                      className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
                          <img
                            src={lead.vehicle.imageUrl}
                            alt={lead.vehicle.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="line-clamp-1 font-medium">
                            {lead.vehicle.year} {lead.vehicle.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lead.summary.budgetUsdMin && lead.summary.budgetUsdMax
                              ? `$${lead.summary.budgetUsdMin.toLocaleString()} - $${lead.summary.budgetUsdMax.toLocaleString()}`
                              : t('dashboard.company.leads_bubble.budget_not_specified')}
                          </span>
                          {lead.priority && (
                            <span className="text-[10px] text-muted-foreground">
                              {lead.priority === 'price' && t('dashboard.company.leads_bubble.priority.price')}
                              {lead.priority === 'speed' && t('dashboard.company.leads_bubble.priority.speed')}
                              {lead.priority === 'premium_service' && t('dashboard.company.leads_bubble.priority.premium')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          data-status={lead.status}
                        >
                          <span className="me-1 flex h-1.5 w-1.5 rounded-full bg-primary" />
                          {statusLabel}
                        </span>
                        {Array.isArray((lead as any).leadSummary?.auctionSources) &&
                          (lead as any).leadSummary.auctionSources.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {(lead as any).leadSummary.auctionSources[0]}
                            </span>
                          )}
                        {expiresLabel && (
                          <span className="text-[10px] text-muted-foreground">
                            {expiresLabel}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        {...getSectionMotionProps(1)}
        role="region"
        aria-label="Company network statistics and dealer activity"
      >
        <div className="grid gap-4 md:grid-cols-3 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:office-building-outline" className="h-5 w-5" />
                {t('dashboard.company.stats.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold">{animatedTotalProfileViews}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.company.stats.profile_views')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{animatedDealersCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.company.stats.active_dealers')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{animatedActiveCompanies}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.company.stats.active_companies')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:map-marker-radius-outline" className="h-5 w-5" />
                {t('dashboard.company.dealer_activity.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyDealerActivityByState.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.company.dealer_activity.empty')}</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {companyDealerActivityByState.map((item) => (
                    <li
                      key={item.state}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5"
                    >
                      <span className="line-clamp-1">{item.state}</span>
                      <span className="text-xs text-muted-foreground">{item.leads} {t('dashboard.company.dealer_activity.leads_label')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:heart-pulse" className="h-5 w-5" />
                {t('dashboard.company.brand_health.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold">{companyBrandHealth.averageRating}</p>
                <p className="text-xs text-muted-foreground">
                  / 5 ({companyBrandHealth.totalReviews} {t('common.reviews')})
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('dashboard.company.brand_health.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(2)}
        role="region"
        aria-label="Company service quality and marketing campaigns"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:headset" className="h-5 w-5" />
                {t('dashboard.company.service_quality.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.company.service_quality.reply_time')}</p>
                  <p className="text-xl font-semibold">{animatedAvgReplyMinutes} {t('common.min')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.company.service_quality.handled_requests')}</p>
                  <p className="text-xl font-semibold">{animatedHandledPercent}%</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('dashboard.company.service_quality.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:bullhorn-outline" className="h-5 w-5" />
                {t('dashboard.company.campaigns.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.company.campaigns.empty')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyCampaigns.map((campaign) => (
                    <li
                      key={campaign.id}
                      className="rounded-md border px-3 py-2 flex flex-col gap-1"
                    >
                      <span className="font-medium line-clamp-1">{campaign.name}</span>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Impr: {campaign.impressions.toLocaleString()}</span>
                        <span>Clicks: {campaign.clicks.toLocaleString()}</span>
                        <span>Leads: {campaign.leads}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(3)}
        role="region"
        aria-label="Company audience segments and competitors"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:account-group-outline" className="h-5 w-5" />
                {t('dashboard.company.segments.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAudienceSegments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.company.segments.empty')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyAudienceSegments.map((segment) => (
                    <li
                      key={segment.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="line-clamp-2 me-2">{segment.label}</span>
                      <span className="text-xs text-muted-foreground">{segment.sharePercent}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:shield-search-outline" className="h-5 w-5" />
                {t('dashboard.company.competitors.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyCompetitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.company.competitors.empty')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyCompetitors.map((competitor) => (
                    <li
                      key={competitor.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{competitor.name}</span>
                        <span className="text-xs text-muted-foreground">{t('dashboard.company.competitors.rating')}: {competitor.rating}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs">
                        <Icon
                          icon={competitor.trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'}
                          className="h-3 w-3"
                        />
                        {competitor.trend === 'up' ? t('dashboard.company.competitors.trend_up') : t('dashboard.company.competitors.trend_down')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(4)}
        role="region"
        aria-label="Company risks, alerts and network actions"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:alert-outline" className="h-5 w-5" />
                {t('dashboard.company.risks.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.company.risks.empty')}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyAlerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <Icon icon="mdi:alert-circle-outline" className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-2">{alert.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:account-cog-outline" className="h-5 w-5" />
                {t('dashboard.company.network_actions.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {companyNetworkActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="justify-start gap-2 text-sm"
                >
                  <Icon icon={action.icon} className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(5)}
        role="region"
        aria-label="Company goals and progress"
      >
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:target-account" className="h-5 w-5" />
              {t('dashboard.company.goals.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.company.goals.empty')}</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {companyGoals.map((goal) => (
                  <li key={goal.id} className="space-y-1">
                    <p className="line-clamp-2">{goal.label}</p>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${goal.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{goal.progressPercent}%</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
