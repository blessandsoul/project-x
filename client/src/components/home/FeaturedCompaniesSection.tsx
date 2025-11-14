import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies, type Company } from '@/mocks/_mockData'

export function FeaturedCompaniesSection() {
  const navigate = useNavigate()

  const companies = useMemo<Company[]>(() => {
    const vips = mockCompanies.filter((c) => c.vipStatus)
    if (vips.length > 0) {
      return vips.slice(0, 3)
    }
    return [...mockCompanies].sort((a, b) => b.rating - a.rating).slice(0, 3)
  }, [])

  if (companies.length === 0) return null

  return (
    <section
      className="border-b bg-muted/30"
      aria-labelledby="home-featured-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-featured-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              VIP იმპორტიორები
            </h2>
            <p className="text-sm text-muted-foreground">
              მაღალი რეიტინგის და გამჭვირვალე პირობების მქონე კომპანიები.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/catalog')}>
            <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
            ხედვა ყველა კომპანიის
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="h-full cursor-pointer border-muted/60 transition-all hover:-translate-y-1 hover:shadow-md"
              onClick={() => navigate(`/company/${company.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {company.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon icon="mdi:map-marker" className="h-3 w-3" />
                    <span>
                      {company.location.city}, {company.location.state}
                    </span>
                  </div>
                </div>
                {company.vipStatus && (
                  <Badge className="bg-orange-100 text-[10px] font-semibold uppercase tracking-wide text-orange-800">
                    VIP
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center">
                    <Icon
                      icon="mdi:star"
                      className="h-4 w-4 text-yellow-400"
                      aria-hidden="true"
                    />
                    <span className="ml-1 font-medium">{company.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({company.reviewCount} შეფასება)
                  </span>
                </div>
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {company.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Icon icon="mdi:cash" className="h-4 w-4 text-primary" />
                    <span>
                      ${company.priceRange.min} - ${company.priceRange.max}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    ფასი, სრული მომსახურებით
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
