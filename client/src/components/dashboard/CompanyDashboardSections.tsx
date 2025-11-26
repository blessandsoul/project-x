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
    if (diffMs <= 0) return t('dashboard.company.leads_bubble.expired')
    const diffMinutesTotal = Math.floor(diffMs / (60 * 1000))
    const hours = Math.floor(diffMinutesTotal / 60)
    const minutes = diffMinutesTotal % 60
    if (hours <= 0) return t('dashboard.company.leads_bubble.minutes_left', { count: minutes })
    return t('dashboard.company.leads_bubble.hours_left', { hours, minutes })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Main Operations (8/12) */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Network Stats */}
        <motion.div {...getSectionMotionProps(0)}>
           <div className="grid grid-cols-3 gap-4">
              <Card className="shadow-sm">
                 <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.company.stats.profile_views')}</p>
                    <p className="text-2xl font-bold text-primary">{animatedTotalProfileViews}</p>
                 </CardContent>
              </Card>
              <Card className="shadow-sm">
                 <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.company.stats.active_dealers')}</p>
                    <p className="text-2xl font-bold">{animatedDealersCount}</p>
                 </CardContent>
              </Card>
              <Card className="shadow-sm">
                 <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.company.stats.active_companies')}</p>
                    <p className="text-2xl font-bold">{animatedActiveCompanies}</p>
                 </CardContent>
              </Card>
           </div>
        </motion.div>

        {/* 2. Incoming Leads */}
        <motion.div {...getSectionMotionProps(1)}>
          <Card className="shadow-sm">
            <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
               <div className="space-y-0.5">
                 <CardTitle className="text-base font-semibold flex items-center gap-2">
                   <Icon icon="mdi:inbox-arrow-down" className="h-4 w-4 text-primary" />
                   {t('dashboard.company.leads_bubble.title')}
                 </CardTitle>
                 <p className="text-[10px] text-muted-foreground">{t('dashboard.company.leads_bubble.subtitle')}</p>
               </div>
               <div className="flex items-center gap-2">
                 {newLeadsCount > 0 && (
                   <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary animate-pulse">
                     {newLeadsCount} NEW
                   </span>
                 )}
                 <Button asChild variant="ghost" size="sm" className="h-6 text-xs">
                   <Link to="/company/leads">{t('common.view_all')}</Link>
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              {companyLeads.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">
                   <p className="text-sm">{t('dashboard.company.leads_bubble.empty')}</p>
                 </div>
              ) : (
                 <div className="divide-y">
                    {companyLeads.slice(0, 5).map(lead => {
                       const expiresLabel = formatExpiresIn(lead.expiresAt)
                       return (
                         <div key={lead.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-3 hover:bg-accent/30 transition-colors group">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden">
                                  <img src={lead.vehicle.imageUrl} alt={lead.vehicle.title} className="h-full w-full object-cover" />
                               </div>
                               <div>
                                  <p className="text-sm font-medium leading-none mb-1">{lead.vehicle.year} {lead.vehicle.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                     <span>
                                        {lead.summary.budgetUsdMin ? `$${lead.summary.budgetUsdMin.toLocaleString()}` : 'N/A'} - {lead.summary.budgetUsdMax ? `$${lead.summary.budgetUsdMax.toLocaleString()}` : 'N/A'}
                                     </span>
                                     {lead.priority && (
                                        <span className="inline-flex items-center rounded bg-secondary px-1 py-0.5 text-[10px] font-medium text-secondary-foreground uppercase">
                                          {lead.priority}
                                        </span>
                                     )}
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                               <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground" data-status={lead.status}>
                                    {lead.status}
                                  </span>
                                  {expiresLabel && <span className="text-[10px] text-red-500 font-medium">{expiresLabel}</span>}
                               </div>
                               <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                  <Link to={`/company/leads/${lead.id}`}>{t('common.view')}</Link>
                               </Button>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Goals & Activity */}
        <motion.div {...getSectionMotionProps(2)}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                 <CardHeader className="px-4 py-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <Icon icon="mdi:target-account" className="h-4 w-4" />
                       {t('dashboard.company.goals.title')}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-4">
                    {companyGoals.map(goal => (
                       <div key={goal.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                             <span>{goal.label}</span>
                             <span className="font-bold">{goal.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                             <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progressPercent}%` }} />
                          </div>
                       </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="shadow-sm">
                 <CardHeader className="px-4 py-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <Icon icon="mdi:map-marker-radius-outline" className="h-4 w-4" />
                       {t('dashboard.company.dealer_activity.title')}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-2">
                    {companyDealerActivityByState.map((item) => (
                       <div key={item.state} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{item.state}</span>
                          <span className="text-muted-foreground">{item.leads} {t('dashboard.company.dealer_activity.leads_label')}</span>
                       </div>
                    ))}
                 </CardContent>
              </Card>
           </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Analytics & Insights (4/12) */}
      <aside className="lg:col-span-4 space-y-6">
         {/* 4. Health & Quality */}
         <motion.div {...getSectionMotionProps(3)}>
            <Card className="shadow-sm bg-gradient-to-b from-background to-muted/20">
               <CardContent className="p-4 grid grid-cols-2 gap-4 divide-x">
                  <div className="text-center pr-2">
                     <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">{t('dashboard.company.brand_health.title')}</p>
                     <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold">{companyBrandHealth.averageRating}</span>
                        <Icon icon="mdi:star" className="h-4 w-4 text-yellow-400" />
                     </div>
                     <p className="text-[10px] text-muted-foreground">{companyBrandHealth.totalReviews} reviews</p>
                  </div>
                  <div className="text-center pl-2">
                     <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">{t('dashboard.company.service_quality.handled_requests')}</p>
                     <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-emerald-600">{animatedHandledPercent}%</span>
                     </div>
                     <p className="text-[10px] text-muted-foreground">{animatedAvgReplyMinutes}m avg reply</p>
                  </div>
               </CardContent>
            </Card>
         </motion.div>

         {/* 5. Risks/Alerts */}
         {companyAlerts.length > 0 && (
            <motion.div {...getSectionMotionProps(4)}>
               <Card className="shadow-sm border-red-100 bg-red-50/30">
                  <CardHeader className="px-4 py-2 border-b border-red-100">
                     <CardTitle className="text-xs font-bold text-red-800 flex items-center gap-2">
                        <Icon icon="mdi:alert-circle-outline" className="h-4 w-4" />
                        {t('dashboard.company.risks.title')}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                     <ul className="divide-y divide-red-100">
                        {companyAlerts.map(alert => (
                           <li key={alert.id} className="p-3 text-xs text-red-700 flex items-start gap-2">
                              <Icon icon="mdi:circle-medium" className="h-4 w-4 mt-0.5 shrink-0" />
                              {alert.text}
                           </li>
                        ))}
                     </ul>
                  </CardContent>
               </Card>
            </motion.div>
         )}

         {/* 6. Campaigns */}
         <motion.div {...getSectionMotionProps(5)}>
            <Card className="shadow-sm">
               <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Icon icon="mdi:bullhorn-outline" className="h-4 w-4" />
                     {t('dashboard.company.campaigns.title')}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <ul className="divide-y">
                     {companyCampaigns.map(camp => (
                        <li key={camp.id} className="p-3 hover:bg-accent/30 transition-colors">
                           <p className="text-xs font-bold mb-1">{camp.name}</p>
                           <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span><span className="font-medium">{camp.impressions}</span> imp</span>
                              <span><span className="font-medium">{camp.clicks}</span> clk</span>
                              <span className="text-primary font-medium">{camp.leads} leads</span>
                           </div>
                        </li>
                     ))}
                  </ul>
               </CardContent>
            </Card>
         </motion.div>

         {/* 7. Segments & Competitors (Tabs) */}
         <motion.div {...getSectionMotionProps(6)}>
            <Card className="shadow-sm">
               <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                     <p className="text-xs font-semibold flex items-center gap-2">
                        <Icon icon="mdi:account-group-outline" className="h-4 w-4" />
                        {t('dashboard.company.segments.title')}
                     </p>
                     <div className="space-y-1">
                        {companyAudienceSegments.map(seg => (
                           <div key={seg.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{seg.label}</span>
                              <span className="font-medium">{seg.sharePercent}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="h-px bg-muted" />
                  <div className="space-y-2">
                     <p className="text-xs font-semibold flex items-center gap-2">
                        <Icon icon="mdi:shield-search-outline" className="h-4 w-4" />
                        {t('dashboard.company.competitors.title')}
                     </p>
                     <div className="space-y-1">
                        {companyCompetitors.map(comp => (
                           <div key={comp.id} className="flex items-center justify-between text-xs">
                              <span>{comp.name}</span>
                              <div className="flex items-center gap-1">
                                 <span className="font-medium">{comp.rating}</span>
                                 <Icon icon={comp.trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'} className={`h-3 w-3 ${comp.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
         
         {/* 8. Actions */}
         <motion.div {...getSectionMotionProps(7)}>
             <div className="grid grid-cols-1 gap-2">
                {companyNetworkActions.map(action => (
                   <Button key={action.id} variant="outline" className="justify-start gap-2 h-8 text-xs bg-background">
                      <Icon icon={action.icon} className="h-4 w-4 text-muted-foreground" />
                      {action.label}
                   </Button>
                ))}
             </div>
         </motion.div>
      </aside>
    </div>
  )
}
