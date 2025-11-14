import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { mockCompanies, type Company } from '@/mocks/_mockData'
import { Icon } from '@iconify/react/dist/iconify.js'

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

        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              ძირითადი შედარება
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs md:text-sm">
              <thead className="border-b bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 font-medium">კომპანია</th>
                  <th className="px-3 py-2 font-medium">რეიტინგი</th>
                  <th className="px-3 py-2 font-medium">შეფასებები</th>
                  <th className="px-3 py-2 font-medium">ფასი (min-max)</th>
                  <th className="px-3 py-2 font-medium">VIP</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{company.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {company.location.city}, {company.location.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Icon
                          icon="mdi:star"
                          className="h-3 w-3 text-yellow-400"
                          aria-hidden="true"
                        />
                        <span>{company.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {company.reviewCount}
                    </td>
                    <td className="px-3 py-2">
                      ${company.priceRange.min} – ${company.priceRange.max}
                    </td>
                    <td className="px-3 py-2">
                      {company.vipStatus ? (
                        <Icon
                          icon="mdi:check-circle"
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Icon
                          icon="mdi:close-circle"
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
