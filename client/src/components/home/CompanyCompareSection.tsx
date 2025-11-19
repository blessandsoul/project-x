import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type Company } from '@/mocks/_mockData'
import { Icon } from '@iconify/react/dist/iconify.js'
import { VipBadge } from '@/components/company/VipBadge'
import { CompanyRating } from '@/components/company/CompanyRating'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CompanyCompareSectionProps = {
  companies: Company[]
  isLoading: boolean
  error: string | null
}

export function CompanyCompareSection({ companies, isLoading, error }: CompanyCompareSectionProps) {
  const navigate = useNavigate()

  const { vipCompanies, regularCompanies } = useMemo(() => {
    if (!companies || companies.length === 0) {
      return { vipCompanies: [] as Company[], regularCompanies: [] as Company[] }
    }

    const sorted = [...companies].sort((a, b) => b.rating - a.rating)
    const vip = sorted.filter((company) => company.vipStatus).slice(0, 3)
    const regular = sorted.filter((company) => !company.vipStatus).slice(0, 3)

    return { vipCompanies: vip, regularCompanies: regular }
  }, [companies])

  if (!isLoading && (error || (vipCompanies.length === 0 && regularCompanies.length === 0))) {
    return null
  }

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

        <div className="grid gap-4 md:grid-cols-2" aria-label="იმპორტიორების შეთავაზებების სია">
          <div className="space-y-3" role="list" aria-label="VIP შეთავაზებები">
            <div className="text-[11px] font-medium text-foreground flex items-center gap-1">
              <Icon
                icon="mdi:crown"
                className="h-3 w-3 text-amber-400"
              />
              <span>Premium / VIP შეთავაზებები</span>
            </div>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index: number) => (
                  <div
                    key={index}
                    className="relative flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 border border-muted/60"
                    role="listitem"
                  >
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))
              : vipCompanies.map((company: Company, index: number) => {
                  const initials = company.name
                    .split(' ')
                    .filter((part: string) => part.length > 0)
                    .map((part: string) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  const tier = index === 0 ? 'diamond' : index === 1 ? 'gold' : 'silver'

                  const includesDocuments = company.services.some((service: string) =>
                    service.toLowerCase().includes('document'),
                  )
                  const includesTransport = company.services.some((service: string) =>
                    service.toLowerCase().includes('shipping'),
                  )
                  const includesCustoms = company.services.some((service: string) =>
                    service.toLowerCase().includes('customs'),
                  )

                  const highlightClass =
                    tier === 'diamond'
                      ? 'border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.5)]'
                      : tier === 'gold'
                        ? 'border-amber-400/70 shadow-[0_0_0_1px_rgба(251,191,36,0.5)]'
                        : 'border-slate-300/70'

                  return (
                    <div
                      key={company.id}
                      className={cn(
                        'relative flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer',
                        highlightClass,
                      )}
                      role="listitem"
                      onClick={() => navigate(`/company/${company.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage
                            alt={company.name}
                            src={company.logo}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {company.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <CompanyRating
                              rating={company.rating}
                              size="sm"
                            />
                            <span>
                              ({company.reviewCount} შეფასება)
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon="mdi:map-marker"
                                className="h-3 w-3"
                              />
                              <span>
                                {company.location.city}, {company.location.state}
                              </span>
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>ტრანსპორტირების ფასი აშშ-დან საქართველოს პორტამდე</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                              <Icon
                                icon="mdi:currency-usd"
                                className="h-4 w-4"
                              />
                              <span>
                                {company.priceRange.min.toLocaleString()} -{' '}
                                {company.priceRange.max.toLocaleString()} USD
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                  <Icon
                                    icon="mdi:shield-check"
                                    className="h-3 w-3"
                                  />
                                  <span>სანდო პარტნიორი</span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <span>
                                  სანდო პარტნიორი — ჩვენი შიდა შეფასებით და მომხმარებელთა გამოხმაურებებით შერჩეული იმპორტერი.
                                </span>
                              </TooltipContent>
                            </Tooltip>
                            {(tier === 'diamond' || tier === 'gold') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                    <Icon
                                      icon="mdi:lock-check"
                                      className="h-3 w-3"
                                    />
                                    <span>დაცული გადახდა</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <span>
                                    დაცული გადახდა — თანხა იფიქსირება სანდო არხით, სანამ იმპორტერი არ დაადასტურებს მომსახურებას.
                                  </span>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {tier === 'diamond' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-600 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                    <Icon
                                      icon="mdi:file-check"
                                      className="h-3 w-3"
                                    />
                                    <span>დოკუმენტები სრულად</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <span>
                                    დოკუმენტები სრულად — იმპორტერი უზრუნველყოფს ყველა საჭირო იმპორტის და რეგისტრაციის დოკუმენტის მომზადებას.
                                  </span>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesDocuments ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesDocuments ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>დოკუმენტები</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>ტრანსპორტირება</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>საბაჟო</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {company.vipStatus && (
                          <VipBadge
                            label={
                              tier === 'diamond'
                                ? 'Diamond VIP'
                                : tier === 'gold'
                                  ? 'Gold VIP'
                                  : 'Silver VIP'
                            }
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
          </div>

          <div className="space-y-3" role="list" aria-label="სტანდარტული შეთავაზებები">
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Icon
                icon="mdi:cash-multiple"
                className="h-3 w-3 text-emerald-500"
              />
              <span>სტანდარტული შეთავაზებები</span>
            </div>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index: number) => (
                  <div
                    key={index}
                    className="relative flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 border border-muted/60"
                    role="listitem"
                  >
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))
              : regularCompanies.map((company: Company) => {
                  const initials = company.name
                    .split(' ')
                    .filter((part: string) => part.length > 0)
                    .map((part: string) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  const includesDocuments = company.services.some((service: string) =>
                    service.toLowerCase().includes('document'),
                  )
                  const includesTransport = company.services.some((service: string) =>
                    service.toLowerCase().includes('shipping'),
                  )
                  const includesCustoms = company.services.some((service: string) =>
                    service.toLowerCase().includes('customs'),
                  )

                  return (
                    <div
                      key={company.id}
                      className={cn(
                        'relative flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border border-slate-300/70 cursor-pointer',
                      )}
                      role="listitem"
                      onClick={() => navigate(`/company/${company.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage
                            alt={company.name}
                            src={company.logo}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {company.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <CompanyRating
                              rating={company.rating}
                              size="sm"
                            />
                            <span>
                              ({company.reviewCount} შეფასება)
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon="mdi:map-marker"
                                className="h-3 w-3"
                              />
                              <span>
                                {company.location.city}, {company.location.state}
                              </span>
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>ტრანსპორტირების ფასი აშშ-დან საქართველოს პორტამდე</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                              <Icon
                                icon="mdi:currency-usd"
                                className="h-4 w-4"
                              />
                              <span>
                                {company.priceRange.min.toLocaleString()} -{' '}
                                {company.priceRange.max.toLocaleString()} USD
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesDocuments ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesDocuments ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>დოკუმენტები</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>ტრანსპორტირება</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Icon
                                icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                className={cn(
                                  'h-3 w-3',
                                  includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                )}
                              />
                              <span>საბაჟო</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>
      </div>
    </section>
  )
}
