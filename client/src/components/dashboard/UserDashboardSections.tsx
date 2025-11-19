import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { CompanyTile } from '@/components/dashboard/CompanyTile'

import type { Company } from '@/mocks/_mockData'

type ActivityStats = {
  viewedCount: number
  favoritesCount: number
  requestsCount: number
}

type OpenRequest = {
  id: string
  companyName: string
  status: string
}

type Guide = {
  id: string
  title: string
}

type Offer = {
  id: string
  companyName: string
  description: string
}

type Reminder = {
  id: string
  text: string
}

type UserDashboardSectionsProps = {
  recommendedCompanies: Company[]
  favoriteCompanies: Company[]
  recentlyViewedCompanies: Company[]
  activityStats: ActivityStats
  mockOpenRequests: OpenRequest[]
  mockGuides: Guide[]
  mockOffers: Offer[]
  mockReminders: Reminder[]
  quickService: string
  quickGeography: string
  quickBudget: 'low' | 'medium' | 'high' | ''
  availableServices: string[]
  availableGeography: string[]
  onQuickSearchSubmit: (event: React.FormEvent) => void
  onQuickServiceChange: (value: string) => void
  onQuickGeographyChange: (value: string) => void
  onQuickBudgetChange: (value: 'low' | 'medium' | 'high') => void
  onClearFavorites: () => void
  onClearRecentlyViewed: () => void
  getSectionMotionProps: (index: number) => Record<string, unknown>
}

export function UserDashboardSections({
  recommendedCompanies,
  favoriteCompanies,
  recentlyViewedCompanies,
  activityStats,
  mockOpenRequests,
  mockGuides,
  mockOffers,
  mockReminders,
  quickService,
  quickGeography,
  quickBudget,
  availableServices,
  availableGeography,
  onQuickSearchSubmit,
  onQuickServiceChange,
  onQuickGeographyChange,
  onQuickBudgetChange,
  onClearFavorites,
  onClearRecentlyViewed,
  getSectionMotionProps,
}: UserDashboardSectionsProps) {
  type CompanySortMode = 'default' | 'rating' | 'city'

  const [sortMode, setSortMode] = useState<CompanySortMode>('rating')

  const sortCompanies = (companies: Company[]): Company[] => {
    if (sortMode === 'rating') {
      return [...companies].sort((a, b) => b.rating - a.rating)
    }

    if (sortMode === 'city') {
      return [...companies].sort((a, b) => a.location.city.localeCompare(b.location.city))
    }

    return companies
  }

  const sortedRecommended = sortCompanies(recommendedCompanies)
  const sortedFavorites = sortCompanies(favoriteCompanies)
  const sortedRecentlyViewed = sortCompanies(recentlyViewedCompanies)
  return (
    <>
      <motion.div
        {...getSectionMotionProps(0)}
        role="region"
        aria-label="User quick search and actions"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-2">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:magnify" className="h-5 w-5" />
                სწრაფი ძიება კომპანიების მიხედვით
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-3" onSubmit={onQuickSearchSubmit}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-service">
                    სერვისის კატეგორია
                  </label>
                  <select
                    id="quick-service"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={quickService}
                    onChange={(event) => onQuickServiceChange(event.target.value)}
                  >
                    <option value="">არ აქვს მნიშვნელობა</option>
                    {availableServices.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-geography">
                    შტატი / რეგიონი
                  </label>
                  <select
                    id="quick-geography"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={quickGeography}
                    onChange={(event) => onQuickGeographyChange(event.target.value)}
                  >
                    <option value="">არ აქვს მნიშვნელობა</option>
                    {availableGeography.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">ბიუჯეტი</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={quickBudget === 'low' ? 'default' : 'outline'}
                      onClick={() => onQuickBudgetChange('low')}
                    >
                      &lt; 4 000$
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={quickBudget === 'medium' ? 'default' : 'outline'}
                      onClick={() => onQuickBudgetChange('medium')}
                    >
                      4 000–8 000$
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={quickBudget === 'high' ? 'default' : 'outline'}
                      onClick={() => onQuickBudgetChange('high')}
                    >
                      &gt; 8 000$
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <Icon icon="mdi:magnify" className="h-4 w-4" />
                    კომპანიის მოძებნა
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:flash" className="h-5 w-5" />
                სწრაფი მოქმედებები
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/search">
                  <Icon icon="mdi:magnify" className="h-4 w-4" />
                  ახალი ძიების დაწყება
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/catalog">
                  <Icon icon="mdi:send-circle-outline" className="h-4 w-4" />
                  საერთო ბრიფის შევსება და გაგზავნა
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/dashboard">
                  <Icon icon="mdi:message-text-outline" className="h-4 w-4" />
                  გადავიდეთ თქვენს მოთხოვნებზე
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(1)}
        role="region"
        aria-label="User recommended and favorite companies"
      >
        <Card className="mt-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">რჩეული კომპანიები</CardTitle>
            {favoriteCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFavorites}
                className="flex items-center gap-1 text-xs"
                motionVariant="scale"
              >
                <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                გასუფთავება
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sortedFavorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ჯერ არ გაქვთ დამატებული რჩეული კომპანიები. გახსენით კატალოგი და შეინახეთ
                საინტერესო კომპანიები.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedFavorites.map((company) => (
                  <CompanyTile key={company.id} company={company} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(3)}
        role="region"
        aria-label="User recently viewed companies"
      >
        <Card className="mt-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">ბოლოს ნახული კომპანიები</CardTitle>
            {recentlyViewedCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRecentlyViewed}
                className="flex items-center gap-1 text-xs"
                motionVariant="scale"
              >
                <Icon icon="mdi:history" className="h-4 w-4" />
                გასუფთავება
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sortedRecentlyViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ჯერ არ გაქვთ ნანახი კომპანიების ისტორია ამ სესიაში. გახსენით რომელიმე კომპანიის გვერდი,
                რომ ნახოთ ისინი აქ.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedRecentlyViewed.map((company: Company) => (
                  <CompanyTile key={company.id} company={company} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(4)}
        role="region"
        aria-label="User activity stats and open requests"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:chart-line" className="h-5 w-5" />
                თქვენი აქტივობის სტატისტიკა
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold">{activityStats.viewedCount}</p>
                  <p className="text-xs text-muted-foreground">ნანახი კომპანია</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activityStats.favoritesCount}</p>
                  <p className="text-xs text-muted-foreground">რჩეული</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activityStats.requestsCount}</p>
                  <p className="text-xs text-muted-foreground">გაგზავნილი მოთხოვნა</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:clipboard-text-clock" className="h-5 w-5" />
                გახსნილი მოთხოვნები / ფასის კოტაციები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockOpenRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ამ ეტაპზე არ გაქვთ გახსნილი მოთხოვნები. დაიწყეთ თანამშრომლობა კომპანიის გვერდიდან.
                </p>
              ) : (
                <div className="space-y-2">
                  {mockOpenRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{request.companyName}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {request.status}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Icon icon="mdi:message-text-outline" className="h-3 w-3" />
                        დიალოგის გახსნა
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(5)}
        role="region"
        aria-label="User guides and special offers"
      >
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:book-open-page-variant" className="h-5 w-5" />
                სასარგებლო სტატიები და გიდები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockGuides.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  სტატიები მალე დაემატება.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {mockGuides.map((guide) => (
                    <li key={guide.id} className="flex items-center justify-between gap-2">
                      <span className="line-clamp-2">{guide.title}</span>
                      <Button size="sm" variant="link" className="px-0 text-xs">
                        კითხვა
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:gift-open-outline" className="h-5 w-5" />
                სპეციალური შეთავაზებები
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ამ მომენტში აქტივი სპეციალური შეთავაზებები არ არის. დაბრუნდით მოგვიანებით.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {mockOffers.map((offer) => (
                    <li
                      key={offer.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{offer.companyName}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {offer.description}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Icon icon="mdi:eye-outline" className="h-3 w-3" />
                        ნახვა
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        {...getSectionMotionProps(6)}
        role="region"
        aria-label="User reminders"
      >
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:bell-outline" className="h-5 w-5" />
              შეგახსენებთ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ამ დროისთვის არ გაქვთ აქტიური შეხსენებები.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {mockReminders.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <Icon icon="mdi:bell-outline" className="h-4 w-4 text-muted-foreground" />
                    <span className="line-clamp-2">{reminder.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
