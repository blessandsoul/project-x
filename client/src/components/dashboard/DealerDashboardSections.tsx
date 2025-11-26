import { useEffect, useState } from 'react'
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

      setValue(Math.round(nextValue))

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

type DealerDashboardSectionsProps = {
  dealerLeadsStats: {
    todayNew: number
    weekNew: number
    inProgress: number
    closed: number
  }
  dealerFunnelStats: {
    profileViews: number
    requests: number
    deals: number
  }
  dealerRequests: Array<{
    id: string
    companyName: string
    clientName: string
    status: string
  }>
  dealerLeadReminders: Array<{
    id: string
    text: string
  }>
  dealerTopPromoted: Array<{
    id: string
    name: string
    responses: number
  }>
  dealerReviewsSummary: {
    averageRating: number
    totalReviews: number
    latestReviews: Array<{
      id: string
      userName: string
      rating: number
      comment: string
    }>
  }
  dealerTrafficStats: {
    totalViews: number
    fromSearch: number
    fromCatalog: number
    fromOffers: number
  }
  dealerTasksToday: string[]
  dealerComparisonStats: {
    leadsDeltaPercent: number
    conversionDeltaPercent: number
    marginDeltaPercent: number
  }
  getSectionMotionProps: (index: number) => Record<string, unknown>
}

export function DealerDashboardSections({
  dealerLeadsStats,
  dealerFunnelStats,
  dealerRequests,
  dealerLeadReminders,
  dealerTopPromoted,
  dealerReviewsSummary,
  dealerTrafficStats,
  dealerTasksToday,
  dealerComparisonStats,
  getSectionMotionProps,
}: DealerDashboardSectionsProps) {
  const { t } = useTranslation()
  const animatedTodayNew = useAnimatedValue(dealerLeadsStats.todayNew)
  const animatedWeekNew = useAnimatedValue(dealerLeadsStats.weekNew)
  const animatedInProgress = useAnimatedValue(dealerLeadsStats.inProgress)
  const animatedClosed = useAnimatedValue(dealerLeadsStats.closed)

  const animatedProfileViews = useAnimatedValue(dealerFunnelStats.profileViews)
  const animatedRequests = useAnimatedValue(dealerFunnelStats.requests)
  const animatedDeals = useAnimatedValue(dealerFunnelStats.deals)

  const animatedTrafficTotal = useAnimatedValue(dealerTrafficStats.totalViews)
  const animatedTrafficSearch = useAnimatedValue(dealerTrafficStats.fromSearch)
  const animatedTrafficCatalog = useAnimatedValue(dealerTrafficStats.fromCatalog)
  const animatedTrafficOffers = useAnimatedValue(dealerTrafficStats.fromOffers)

  const animatedLeadsDelta = useAnimatedValue(dealerComparisonStats.leadsDeltaPercent)
  const animatedConversionDelta = useAnimatedValue(dealerComparisonStats.conversionDeltaPercent)
  const animatedMarginDelta = useAnimatedValue(dealerComparisonStats.marginDeltaPercent)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Main Stats & Pipeline (8/12) */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Leads Overview */}
        <motion.div {...getSectionMotionProps(0)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm">
               <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.dealer.leads.today_new')}</p>
                  <p className="text-2xl font-bold text-primary">{animatedTodayNew}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm">
               <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.dealer.leads.week_new')}</p>
                  <p className="text-2xl font-bold">{animatedWeekNew}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm">
               <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.dealer.leads.in_progress')}</p>
                  <p className="text-2xl font-bold">{animatedInProgress}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm">
               <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('dashboard.dealer.leads.closed')}</p>
                  <p className="text-2xl font-bold">{animatedClosed}</p>
               </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 2. Funnel & Comparison */}
        <motion.div {...getSectionMotionProps(1)}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                 <CardHeader className="px-4 py-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <Icon icon="mdi:chart-timeline-variant" className="h-4 w-4" />
                       {t('dashboard.dealer.funnel.title')}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboard.dealer.funnel.views')}</span>
                      <span className="font-medium">{animatedProfileViews}</span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                       <div className="h-full bg-primary/30" style={{ width: '100%' }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboard.dealer.funnel.requests')}</span>
                      <span className="font-medium">{animatedRequests}</span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                       <div className="h-full bg-primary/60" style={{ width: `${(dealerFunnelStats.requests / dealerFunnelStats.profileViews) * 100}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboard.dealer.funnel.deals')}</span>
                      <span className="font-medium">{animatedDeals}</span>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                       <div className="h-full bg-primary" style={{ width: `${(dealerFunnelStats.deals / dealerFunnelStats.requests) * 100}%` }} />
                    </div>
                 </CardContent>
              </Card>

              <Card className="shadow-sm">
                 <CardHeader className="px-4 py-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <Icon icon="mdi:chart-box-outline" className="h-4 w-4" />
                       {t('dashboard.dealer.comparison.title')}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">{t('dashboard.dealer.comparison.leads_count')}</p>
                      <p className={`text-lg font-bold ${animatedLeadsDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {animatedLeadsDelta > 0 ? '+' : ''}{animatedLeadsDelta}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">{t('dashboard.dealer.comparison.conversion')}</p>
                      <p className={`text-lg font-bold ${animatedConversionDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {animatedConversionDelta > 0 ? '+' : ''}{animatedConversionDelta}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">{t('dashboard.dealer.comparison.margin')}</p>
                      <p className={`text-lg font-bold ${animatedMarginDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {animatedMarginDelta > 0 ? '+' : ''}{animatedMarginDelta}%
                      </p>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </motion.div>

        {/* 3. Recent Requests */}
        <motion.div {...getSectionMotionProps(2)}>
           <Card className="shadow-sm">
             <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                   <Icon icon="mdi:inbox-arrow-down" className="h-4 w-4" />
                   {t('dashboard.dealer.requests.title')}
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               {dealerRequests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">{t('dashboard.dealer.requests.empty')}</p>
                  </div>
               ) : (
                  <div className="divide-y">
                    {dealerRequests.map(request => (
                       <div key={request.id} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                          <div>
                             <p className="font-medium text-sm">{request.clientName}</p>
                             <p className="text-xs text-muted-foreground">{request.companyName}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                               {request.status}
                             </span>
                             <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                               <Icon icon="mdi:reply-outline" className="h-3 w-3" />
                               {t('dashboard.dealer.requests.reply')}
                             </Button>
                          </div>
                       </div>
                    ))}
                  </div>
               )}
             </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Sidebar (4/12) */}
      <aside className="lg:col-span-4 space-y-6">
         {/* 4. Quick Actions */}
         <motion.div {...getSectionMotionProps(3)}>
            <Card className="shadow-sm bg-muted/20 border-dashed">
               <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Icon icon="mdi:flash" className="h-4 w-4" />
                     {t('dashboard.dealer.actions.title')}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-2 grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start gap-2 h-9 text-sm bg-background">
                     <Icon icon="mdi:plus-circle-outline" className="h-4 w-4 text-primary" />
                     {t('dashboard.dealer.actions.add_offer')}
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-9 text-sm bg-background">
                     <Icon icon="mdi:bullhorn-outline" className="h-4 w-4 text-primary" />
                     {t('dashboard.dealer.actions.launch_promo')}
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-9 text-sm bg-background">
                     <Icon icon="mdi:cash-sync" className="h-4 w-4 text-primary" />
                     {t('dashboard.dealer.actions.update_prices')}
                  </Button>
               </CardContent>
            </Card>
         </motion.div>

         {/* 5. Tasks & Reminders */}
         <motion.div {...getSectionMotionProps(4)}>
            <Card className="shadow-sm">
               <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Icon icon="mdi:checklist" className="h-4 w-4" />
                     {t('dashboard.dealer.tasks.title')}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <ul className="divide-y">
                     {dealerTasksToday.map((task, i) => (
                        <li key={i} className="p-3 flex items-start gap-2 text-sm hover:bg-accent/30">
                           <Icon icon="mdi:checkbox-blank-circle-outline" className="h-4 w-4 text-muted-foreground mt-0.5" />
                           <span>{task}</span>
                        </li>
                     ))}
                     {dealerLeadReminders.map(reminder => (
                        <li key={reminder.id} className="p-3 flex items-start gap-2 text-sm bg-amber-50/50 hover:bg-amber-100/50 text-amber-900">
                           <Icon icon="mdi:alert-outline" className="h-4 w-4 text-amber-600 mt-0.5" />
                           <span>{reminder.text}</span>
                        </li>
                     ))}
                  </ul>
               </CardContent>
            </Card>
         </motion.div>

         {/* 6. Traffic Stats */}
         <motion.div {...getSectionMotionProps(5)}>
            <Card className="shadow-sm">
               <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Icon icon="mdi:chart-areaspline" className="h-4 w-4" />
                     {t('dashboard.dealer.traffic.title')}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">{t('dashboard.dealer.traffic.total')}</span>
                     <span className="font-bold">{animatedTrafficTotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">{t('dashboard.dealer.traffic.search')}</span>
                     <span>{animatedTrafficSearch}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">{t('dashboard.dealer.traffic.catalog')}</span>
                     <span>{animatedTrafficCatalog}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">{t('dashboard.dealer.traffic.offers')}</span>
                     <span>{animatedTrafficOffers}</span>
                  </div>
               </CardContent>
            </Card>
         </motion.div>

         {/* 7. Top Offers & Reviews */}
         <motion.div {...getSectionMotionProps(6)}>
            <Card className="shadow-sm">
               <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Icon icon="mdi:star-circle-outline" className="h-4 w-4" />
                     {t('dashboard.dealer.top_offers.title')}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <ul className="divide-y">
                     {dealerTopPromoted.map(item => (
                        <li key={item.id} className="p-3 flex items-center justify-between text-sm">
                           <span className="font-medium truncate">{item.name}</span>
                           <span className="text-xs text-muted-foreground">{item.responses} {t('common.reviews')}</span>
                        </li>
                     ))}
                  </ul>
                  <div className="p-3 border-t bg-muted/10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                           <span className="font-bold">{dealerReviewsSummary.averageRating}</span>
                           <Icon icon="mdi:star" className="h-3 w-3 text-yellow-400" />
                           <span className="text-xs text-muted-foreground">({dealerReviewsSummary.totalReviews})</span>
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                           <Link to="/reviews">{t('common.view_all')}</Link>
                        </Button>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </aside>
    </div>
  )
}
