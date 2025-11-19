import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

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

type CompanyDashboardSectionsProps = {
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
  const animatedTotalProfileViews = useAnimatedValue(companyNetworkStats.totalProfileViews)
  const animatedDealersCount = useAnimatedValue(companyNetworkStats.dealersCount)
  const animatedActiveCompanies = useAnimatedValue(companyNetworkStats.activeCompaniesCount)

  const animatedAvgReplyMinutes = useAnimatedValue(companyServiceQuality.avgReplyMinutes)
  const animatedHandledPercent = useAnimatedValue(companyServiceQuality.handledPercent)
  return (
    <>
      <motion.div
        {...getSectionMotionProps(0)}
        role="region"
        aria-label="Company network statistics and dealer activity"
      >
        <div className="grid gap-4 md:grid-cols-3 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:office-building-outline" className="h-5 w-5" />
                ქსელის საერთო სტატისტიკა
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold">{animatedTotalProfileViews}</p>
                  <p className="text-xs text-muted-foreground">პროფილის ნახვები</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{animatedDealersCount}</p>
                  <p className="text-xs text-muted-foreground">აქტიური დილერი</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{animatedActiveCompanies}</p>
                  <p className="text-xs text-muted-foreground">აქტიური კომპანია</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:map-marker-radius-outline" className="h-5 w-5" />
                დილერების აქტივობა შტატების მიხედვით
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyDealerActivityByState.length === 0 ? (
                <p className="text-sm text-muted-foreground">აქტივობის მონაცემები ჯერ არ არის.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {companyDealerActivityByState.map((item) => (
                    <li
                      key={item.state}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5"
                    >
                      <span className="line-clamp-1">{item.state}</span>
                      <span className="text-xs text-muted-foreground">{item.leads} ლიძე / აქტივობა</span>
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
                Brand health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold">{companyBrandHealth.averageRating}</p>
                <p className="text-xs text-muted-foreground">
                  / 5 ({companyBrandHealth.totalReviews} შეფასება)
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ბრენდის საერთო აღქმა ყველა ქსელის დილერის მიხედვით.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(1)}
        role="region"
        aria-label="Company service quality and marketing campaigns"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:headset" className="h-5 w-5" />
                მომსახურების ხარისხი
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">საშ. რეაგირების დრო</p>
                  <p className="text-xl font-semibold">{animatedAvgReplyMinutes} წთ</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">დამუშავებული მოთხოვნები</p>
                  <p className="text-xl font-semibold">{animatedHandledPercent}%</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                მონაცემა ილუსტრირებულია, შემდგომში ჩანაცვლდება რეალური API მონაცემებით.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:bullhorn-outline" className="h-5 w-5" />
                მარკეტინგული კამპანიები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">ამ დროისთვის აქტიური კამპანიები არ არის.</p>
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
        {...getSectionMotionProps(2)}
        role="region"
        aria-label="Company audience segments and competitors"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:account-group-outline" className="h-5 w-5" />
                აუდიტორიის სეგმენტები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAudienceSegments.length === 0 ? (
                <p className="text-sm text-muted-foreground">სეგმენტაციის მონაცემები არ არის.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyAudienceSegments.map((segment) => (
                    <li
                      key={segment.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="line-clamp-2 mr-2">{segment.label}</span>
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
                კონკურენტების მონიტორინგი
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyCompetitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">კონკურენტების მონაცემები არ არის.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {companyCompetitors.map((competitor) => (
                    <li
                      key={competitor.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{competitor.name}</span>
                        <span className="text-xs text-muted-foreground">რეიტინგი: {competitor.rating}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs">
                        <Icon
                          icon={competitor.trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'}
                          className="h-3 w-3"
                        />
                        {competitor.trend === 'up' ? 'ზრდა' : 'კლება'}
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
        {...getSectionMotionProps(3)}
        role="region"
        aria-label="Company risks, alerts and network actions"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:alert-outline" className="h-5 w-5" />
                რისკები და ალერთები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">ამ დროისთვის რისკები არაა გამოვლენილი.</p>
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
                დილერული ქსელის მართვა
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
        {...getSectionMotionProps(4)}
        role="region"
        aria-label="Company goals and progress"
      >
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:target-account" className="h-5 w-5" />
              გეგმები და მიზნები
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">ამ ეტაპზე მიზნები არ არის დაკონფიგურირებული.</p>
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
