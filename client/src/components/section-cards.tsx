import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import type { UserRole } from "@/types/api"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

function useAnimatedMetric(target: number, durationMs = 600): number {
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

type SectionCardsProps = {
  role: UserRole
}

export function SectionCards({ role }: SectionCardsProps) {
  const { t } = useTranslation()
  const baseCardClassName = "shadow-sm rounded-md px-2 py-1.5 sm:px-3 sm:py-2"

  const animatedDealerLeads = useAnimatedMetric(32)
  const animatedDealerListings = useAnimatedMetric(12)
  const animatedDealerDeals = useAnimatedMetric(5)
  const animatedDealerMargin = useAnimatedMetric(8.2)

  const animatedCompanyViews = useAnimatedMetric(2430)
  const animatedCompanyQuotes = useAnimatedMetric(27)
  const animatedCompanyConversion = useAnimatedMetric(6.3)
  const animatedCompanyRating = useAnimatedMetric(4.7)

  const animatedTotal = useAnimatedMetric(1250)
  const animatedNew = useAnimatedMetric(1234)
  const animatedAccounts = useAnimatedMetric(45678)
  const animatedGrowth = useAnimatedMetric(4.5)

  if (role === "dealer") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-2 sm:px-4">
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.leads')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
              {animatedDealerLeads}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.listings')}</span>
              <TrendingDownIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
              {animatedDealerListings}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
          <CardHeader className="p-0 space-y-0">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.deals')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedDealerDeals}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.margin')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedDealerMargin.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (role === "company") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-2 sm:px-4">
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.views')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedCompanyViews.toLocaleString("en-US")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.quotes')}</span>
              <TrendingDownIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedCompanyQuotes}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.conversion')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedCompanyConversion.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{t('dashboard.cards.rating')}</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              {animatedCompanyRating.toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-2 sm:px-4">
      <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
        <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>{t('dashboard.cards.total')}</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            ${animatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
        <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>{t('dashboard.cards.new')}</span>
            <TrendingDownIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            {animatedNew.toLocaleString("en-US")}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
        <CardHeader className="p-0 space-y-0">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>{t('dashboard.cards.accounts')}</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            {animatedAccounts.toLocaleString("en-US")}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
        <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>{t('dashboard.cards.growth')}</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
            {animatedGrowth.toFixed(1)}%
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
