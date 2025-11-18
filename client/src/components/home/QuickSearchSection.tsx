import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterTag } from '@/components/company/FilterTag'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@iconify/react/dist/iconify.js'
import { motion, useReducedMotion } from 'framer-motion'
import { mockSearchFilters } from '@/mocks/_mockData'
import { useCompanySearch } from '@/hooks/useCompanySearch'

interface QuickFiltersState {
  geography?: string
  service?: string
  rating: string
  vipOnly: boolean
}

const STORAGE_KEY = 'projectx_quicksearch_filters'

function loadInitialFilters(): QuickFiltersState {
  if (typeof window === 'undefined') {
    return { rating: '0', vipOnly: false }
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { rating: '0', vipOnly: false }
    const parsed = JSON.parse(stored) as Partial<QuickFiltersState>
    return {
      geography: parsed.geography,
      service: parsed.service,
      rating: parsed.rating ?? '0',
      vipOnly: parsed.vipOnly ?? false,
    }
  } catch {
    return { rating: '0', vipOnly: false }
  }
}

export function QuickSearchSection() {
  const navigate = useNavigate()
  const { updateFilters, resetFilters } = useCompanySearch()
  const [filters, setFilters] = useState<QuickFiltersState>(() => loadInitialFilters())

  const shouldReduceMotion = useReducedMotion()

  const defaultSectionMotionProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  } as const

  const reducedSectionMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  } as const

  const sectionMotionProps = shouldReduceMotion
    ? reducedSectionMotionProps
    : defaultSectionMotionProps

  const persistFilters = (next: QuickFiltersState) => {
    setFilters(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const applyQuickFiltersToSearchContext = (quick: QuickFiltersState) => {
    const ratingNumber = Number.parseInt(quick.rating || '0', 10) || 0

    updateFilters({
      geography: quick.geography ? [quick.geography] : [],
      services: quick.service ? [quick.service] : [],
      rating: ratingNumber,
      vipOnly: quick.vipOnly,
    })
  }

  const handleSearch = () => {
    applyQuickFiltersToSearchContext(filters)
    navigate('/catalog')
  }

  const handleReset = () => {
    const next: QuickFiltersState = {
      geography: undefined,
      service: undefined,
      rating: '0',
      vipOnly: false,
    }

    persistFilters(next)
    resetFilters()
  }

  const applyPreset = (preset: Partial<QuickFiltersState>) => {
    const next: QuickFiltersState = {
      ...filters,
      ...preset,
    }
    persistFilters(next)
    applyQuickFiltersToSearchContext(next)
    navigate('/catalog')
  }

  return (
    <motion.section
      {...sectionMotionProps}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border-b bg-background"
      aria-labelledby="home-quick-search-heading"
    >
      <div className="container mx-auto py-6 md:py-8">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon icon="mdi:tune-variant" className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle id="home-quick-search-heading" className="text-lg font-semibold">
                  სწრაფი ძიება კომპანიის მიხედვით
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  დააყენე ფილტრები ან აირჩიე მზად სცენარი და ნახე შედეგები რამდენიმე წამში.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-[3fr,2fr] md:items-start">
              <div className="space-y-4 md:max-w-3xl">
                <div className="flex flex-col gap-3 md:flex-row md:gap-2 md:items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-state">
                      შტატი აშშ-ში
                    </label>
                    <Select
                      value={filters.geography}
                      onValueChange={(value) =>
                        persistFilters({ ...filters, geography: value })
                      }
                    >
                      <SelectTrigger id="quick-state" className="w-full md:w-44">
                        <SelectValue placeholder="აირჩიეთ შტატი" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSearchFilters.geography.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-service">
                      მომსახურება
                    </label>
                    <Select
                      value={filters.service}
                      onValueChange={(value) =>
                        persistFilters({ ...filters, service: value })
                      }
                    >
                      <SelectTrigger id="quick-service" className="w-full md:w-48">
                        <SelectValue placeholder="აირჩიეთ მომსახურება" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSearchFilters.services.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-rating">
                      მინ. რეიტინგი
                    </label>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <Select
                        value={filters.rating}
                        onValueChange={(value) =>
                          persistFilters({ ...filters, rating: value })
                        }
                      >
                        <SelectTrigger id="quick-rating" className="w-full md:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">ყველა</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="quick-vip"
                          checked={filters.vipOnly}
                          onCheckedChange={(v) =>
                            persistFilters({ ...filters, vipOnly: !!v })
                          }
                        />
                        <label htmlFor="quick-vip" className="text-xs text-muted-foreground">
                          მხოლოდ VIP კომპანიები
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-start md:ml-0">
                    <Button
                      className="w-full md:w-auto md:px-5"
                      onClick={handleSearch}
                      motionVariant="scale"
                    >
                      <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                      ძებნა
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    ფილტრების გასუფთავება
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-muted/60 bg-background p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon
                    icon="mdi:lightning-bolt"
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  <span>პოპულარული სცენარები ერთ დაჭერაში</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  აირჩიეთ ყველაზე გავრცელებული კომბინაციებიდან და გადავუხტეთ პირდაპირ
                  შედეგებს.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <FilterTag
                    onClick={() =>
                      applyPreset({
                        geography: 'California',
                        service: 'Full Import Service',
                        rating: '4',
                        vipOnly: true,
                      })
                    }
                  >
                    SUV • California • VIP
                  </FilterTag>
                  <FilterTag
                    onClick={() =>
                      applyPreset({
                        geography: 'Florida',
                        service: 'Shipping',
                        rating: '3',
                        vipOnly: false,
                      })
                    }
                  >
                    Sedan • Florida • 3+
                  </FilterTag>
                  <FilterTag
                    onClick={() =>
                      applyPreset({
                        geography: 'Georgia',
                        service: 'Full Import Service',
                        rating: '5',
                        vipOnly: true,
                      })
                    }
                  >
                    Premium • Georgia • 5★ • VIP
                  </FilterTag>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  )
}
