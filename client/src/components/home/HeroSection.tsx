import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies } from '@/mocks/_mockData'

export function HeroSection() {
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const total = mockCompanies.length
    const vip = mockCompanies.filter((c) => c.vipStatus).length
    const avgRatingRaw =
      total === 0
        ? 0
        :
          mockCompanies.reduce((sum, c) => sum + c.rating, 0) /
          total
    const avgRating = Math.round(avgRatingRaw * 10) / 10

    return { total, vip, avgRating }
  }, [])

  return (
    <section
      className="border-b bg-gradient-to-b from-background to-muted/40"
      aria-labelledby="home-hero-heading"
    >
      <div className="container mx-auto py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon icon="mdi:shield-check" className="mr-1 h-3 w-3" />
              სანდო იმპორტის პლატფორმა აშშ-დან საქართველოში
            </div>
            <div className="space-y-4">
              <h1
                id="home-hero-heading"
                className="text-3xl font-bold tracking-tight md:text-5xl"
              >
                იპოვეთ სანდო კომპანიები ავტომობილების იმპორტისთვის აშშ-დან
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                შეადარეთ ფასები, რეიტინგები და მომსახურება ერთ სივრცეში.
                გამჭვირვალე პირობები, ვერიფიცირებული იმპორტიორები და
                მხარდაჭერა ქართულ ენაზე.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/search')}>
                <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                იპოვე კომპანია
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/catalog')}
              >
                <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
                ხედვა კატალოგი
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:check-circle"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>ვერიფიცირებული იმპორტიორები</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:cash"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>გამჭვირვალე ფასები</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <Card className="w-full max-w-sm border-primary/20 bg-background/80 shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm font-medium text-muted-foreground">
                  სტატისტიკა პლატფორმაზე
                </p>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      კომპანია
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.vip}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      VIP იმპორტიორი
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.avgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      საშუალო რეიტინგი
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:information-outline"
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <p>
                      ყველა მონაცემი არის დემო რეჟიმში და მომავალი API-ის
                      ინტეგრაციისთვის მზად.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
