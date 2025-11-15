import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import type { UserRole } from "@/mocks/_mockData"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type SectionCardsProps = {
  role: UserRole
}

export function SectionCards({ role }: SectionCardsProps) {
  const baseCardClassName = "shadow-sm rounded-md px-2 py-1.5 sm:px-3 sm:py-2"

  if (role === "dealer") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-2 sm:px-4">
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Leads</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
              32
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Listings</span>
              <TrendingDownIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
              12
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
          <CardHeader className="p-0 space-y-0">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Deals</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              5
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Margin</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              8.2%
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
              <span>Views</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              2,430
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Quotes</span>
              <TrendingDownIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              27
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Conv.</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              6.3%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
          <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>Rating</span>
              <TrendingUpIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
              4.7
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
            <span>Total</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            $1,250.00
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-red-200 bg-red-50`}>
        <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>New</span>
            <TrendingDownIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            1,234
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
        <CardHeader className="p-0 space-y-0">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>Accounts</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold tabular-nums">
            45,678
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className={`${baseCardClassName} border-emerald-200 bg-emerald-50`}>
        <CardHeader className="p-0 space-y-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
            <span>Growth</span>
            <TrendingUpIcon className="h-3 w-3" />
          </div>
          <CardTitle className="text-xs sm:text-sm font-semibold tabular-nums">
            4.5%
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
