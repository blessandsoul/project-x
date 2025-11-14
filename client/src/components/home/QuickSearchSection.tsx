import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockSearchFilters } from '@/mocks/_mockData'

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
  const [filters, setFilters] = useState<QuickFiltersState>(() => loadInitialFilters())

  const persistFilters = (next: QuickFiltersState) => {
    setFilters(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const handleSearch = () => {
    // TODO-FX: Пробросить фильтры в /search через query или контекст.
    navigate('/search')
  }

  const applyPreset = (preset: Partial<QuickFiltersState>) => {
    const next: QuickFiltersState = {
      ...filters,
      ...preset,
    }
    persistFilters(next)
    navigate('/search')
  }

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-quick-search-heading"
    >
      <div className="container mx-auto py-10">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle id="home-quick-search-heading" className="text-lg font-semibold">
                სწრაფი ძიება კომპანიის მიხედვით
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                აირჩიეთ ძირითადი პარამეტრები და ნახეთ შედეგები წუთებში.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5 md:items-end">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-state">
                  შტატი აშშ-ში
                </label>
                <Select
                  value={filters.geography}
                  onValueChange={(value) =>
                    persistFilters({ ...filters, geography: value })
                  }
                >
                  <SelectTrigger id="quick-state">
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

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-service">
                  მომსახურება
                </label>
                <Select
                  value={filters.service}
                  onValueChange={(value) =>
                    persistFilters({ ...filters, service: value })
                  }
                >
                  <SelectTrigger id="quick-service">
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
                <Select
                  value={filters.rating}
                  onValueChange={(value) =>
                    persistFilters({ ...filters, rating: value })
                  }
                >
                  <SelectTrigger id="quick-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">ყველა</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 flex items-center gap-2">
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

              <div className="flex items-end justify-start md:justify-end">
                <Button className="w-full md:w-auto" onClick={handleSearch}>
                  <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                  ძებნა
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground">პოპულარული მოთხოვნები:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
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
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
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
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
