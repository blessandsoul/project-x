import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

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
    <>
      <motion.div
        {...getSectionMotionProps(0)}
        role="region"
        aria-label="Dealer leads overview"
      >
        <div className="grid gap-4 md:grid-cols-3 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:account-group" className="h-5 w-5" />
                ლიდების პანელი
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">ახალი დღეს</p>
                  <p className="text-xl font-semibold">{animatedTodayNew}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ახალი ამ კვირაში</p>
                  <p className="text-xl font-semibold">{animatedWeekNew}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">მუშავდება</p>
                  <p className="text-xl font-semibold">{animatedInProgress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">დახურული</p>
                  <p className="text-xl font-semibold">{animatedClosed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:chart-timeline-variant" className="h-5 w-5" />
                გაყიდვების ვორონკა
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">პროფილის ნახვები</span>
                  <span className="font-medium">{animatedProfileViews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">მოთხოვნები</span>
                  <span className="font-medium">{animatedRequests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">დადებული გარიგებები</span>
                  <span className="font-medium">{animatedDeals}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:flash" className="h-5 w-5" />
                სწრაფი მოქმედებები
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/catalog">
                  <Icon icon="mdi:plus-circle-outline" className="h-4 w-4" />
                  ახალი შეთავაზების დამატება
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/dashboard">
                  <Icon icon="mdi:bullhorn-outline" className="h-4 w-4" />
                  აქციის გაშვება
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/catalog">
                  <Icon icon="mdi:cash-sync" className="h-4 w-4" />
                  ფასების განახლება
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(1)}
        role="region"
        aria-label="Dealer requests and lead reminders"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:inbox-arrow-down" className="h-5 w-5" />
                ახალი კლიენტების მოთხოვნები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealerRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ამ ეტაპზე არ გაქვთ ახალი მოთხოვნები.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {dealerRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{request.clientName}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {request.companyName}
                        </span>
                        <span className="text-xs text-muted-foreground">სტატუსი: {request.status}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Icon icon="mdi:reply-outline" className="h-3 w-3" />
                          პასუხის გაცემა
                        </Button>
                        <Button size="sm" variant="ghost" className="flex items-center gap-1">
                          <Icon icon="mdi:check-circle-outline" className="h-3 w-3" />
                          დამუშავებულია
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:bell-outline" className="h-5 w-5" />
                შეხსენებები ლიდებზე
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealerLeadReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ამ დროისთვის არ გაქვთ კრიტიკული შეხსენებები.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {dealerLeadReminders.map((reminder) => (
                    <li
                      key={reminder.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <Icon icon="mdi:alert-outline" className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-2">{reminder.text}</span>
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
        aria-label="Dealer top offers and customer reviews"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:star-circle-outline" className="h-5 w-5" />
                ტოპ შეთავაზებები / პოზიციები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealerTopPromoted.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერ არ გაქვთ გამოკვეთილი ტოპ შეთავაზებები.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {dealerTopPromoted.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="line-clamp-1">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.responses} გამოხმაურება
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:star-outline" className="h-5 w-5" />
                კლიენტების შეფასებები
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{dealerReviewsSummary.averageRating}</span>
                <span className="text-xs text-muted-foreground">
                  / 5 ({dealerReviewsSummary.totalReviews} შეფასება)
                </span>
              </div>
              {dealerReviewsSummary.latestReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერ არ გაქვთ შეფასებები.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {dealerReviewsSummary.latestReviews.map((review) => (
                    <li key={review.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium line-clamp-1">{review.userName}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Icon
                            icon="mdi:star"
                            className="h-3 w-3 text-yellow-400 fill-current"
                          />
                          {review.rating}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Icon icon="mdi:comment-edit-outline" className="h-3 w-3" />
                  შეფასებების მართვა
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(3)}
        role="region"
        aria-label="Dealer profile traffic and today tasks"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:chart-areaspline" className="h-5 w-5" />
                ტრაფიკი დილერის პროფილზე
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">სულ ნახვები</span>
                  <span className="font-medium">{animatedTrafficTotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ძიების ბლოკიდან</span>
                  <span className="font-medium">{animatedTrafficSearch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">კატალოგიდან</span>
                  <span className="font-medium">{animatedTrafficCatalog}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">აქციებიდან / შეთავაზებებიდან</span>
                  <span className="font-medium">{animatedTrafficOffers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:checklist" className="h-5 w-5" />
                დღევანდელი ამოცანები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealerTasksToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">დღევანდელი ამოცანები არ არის დამატებული.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {dealerTasksToday.map((task) => (
                    <li
                      key={task}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <Icon icon="mdi:checkbox-blank-circle-outline" className="h-3 w-3" />
                      <span className="line-clamp-2">{task}</span>
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
        aria-label="Dealer performance comparison with previous period"
      >
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:chart-box-outline" className="h-5 w-5" />
              შედარება წინა პერიოდთან
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">ლიდების რაოდენობა</p>
                <p className="text-lg font-semibold">
                  {animatedLeadsDelta > 0 ? '+' : ''}
                  {animatedLeadsDelta}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">კონვერსია გარიგებებში</p>
                <p className="text-lg font-semibold">
                  {animatedConversionDelta > 0 ? '+' : ''}
                  {animatedConversionDelta}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">საშ. მარჟა</p>
                <p className="text-lg font-semibold">
                  {animatedMarginDelta > 0 ? '+' : ''}
                  {animatedMarginDelta}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
