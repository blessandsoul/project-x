import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockCompanies, type Company } from '@/mocks/_mockData'
import { Icon } from '@iconify/react/dist/iconify.js'
import { VipBadge } from '@/components/company/VipBadge'

export function CompanyCompareSection() {
  const companies = useMemo<Company[]>(() => {
    return [...mockCompanies].sort((a, b) => b.rating - a.rating).slice(0, 3)
  }, [])

  if (companies.length === 0) return null

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-compare-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-compare-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              შეადარე იმპორტიორები ერთ ცხრილში
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              რეპუტაცია, ფასი და მომსახურება ერთი მიმოხილვით.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-full rounded-md border bg-card">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3 min-w-[220px]">კომპანია</TableHead>
                    <TableHead className="min-w-[120px] text-right">რეიტინგი</TableHead>
                    <TableHead className="min-w-[140px] text-right">ფასი (USD)</TableHead>
                    <TableHead className="min-w-[120px] text-right">შეფასებები</TableHead>
                    <TableHead className="min-w-[80px] text-center">VIP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company, index) => {
                    const initials = company.name
                      .split(' ')
                      .filter((part) => part.length > 0)
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()

                    // Demo tiers: 0 = VIP DIAMOND, 1 = VIP GOLD, 2 = VIP SILVER
                    const tier = index === 0 ? 'diamond' : index === 1 ? 'gold' : 'silver'
                    const rowClassName =
                      tier === 'diamond'
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-500'
                        : tier === 'gold'
                          ? 'bg-amber-50/80 border-l-4 border-amber-400'
                          : 'bg-slate-50/80 border-l-4 border-slate-300'

                    return (
                      <TableRow
                        key={company.id}
                        className={rowClassName}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                alt={company.name}
                                src={company.logo}
                              />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {company.name}
                                </span>
                                <span
                                  className={
                                    tier === 'diamond'
                                      ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700'
                                      : tier === 'gold'
                                        ? 'rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700'
                                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700'
                                  }
                                >
                                  {tier === 'diamond'
                                    ? 'VIP DIAMOND'
                                    : tier === 'gold'
                                      ? 'VIP GOLD'
                                      : 'VIP SILVER'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {company.location.city}, {company.location.state}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Icon
                              icon="mdi:star"
                              className="h-4 w-4 text-yellow-400"
                              aria-hidden="true"
                            />
                            <span>{company.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {company.priceRange.min.toLocaleString()} -{' '}
                          {company.priceRange.max.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {company.reviewCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {company.vipStatus ? (
                            <VipBadge className="inline-flex" />
                          ) : (
                            <Icon
                              icon="mdi:close-circle"
                              className="inline-block h-4 w-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>
    </section>
  )
}
