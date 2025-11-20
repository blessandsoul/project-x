import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { CompanyTile } from '@/components/dashboard/CompanyTile'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

import { mockCars } from '@/mocks/_mockData'
import type { Company } from '@/mocks/_mockData'
import type { UserLeadOffer } from '@/api/userLeads'

type ActivityStats = {
  viewedCount: number
  favoritesCount: number
  requestsCount: number
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
  userLeadOffers: UserLeadOffer[]
  userLeadOffersLoading: boolean
  userLeadOffersError: string | null
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
  userLeadOffers,
  userLeadOffersLoading,
  userLeadOffersError,
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
  const [activeDialogOffer, setActiveDialogOffer] = useState<UserLeadOffer | null>(null)
  const [compareIndices, setCompareIndices] = useState<number[]>([])
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)

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
  const getOfferStatusLabel = (status: string): string => {
    switch (status) {
      case 'SELECTED':
        return 'არჩეული შეთავაზება'
      case 'PENDING':
        return 'მიმდინარე შეთავაზება'
      case 'REJECTED':
        return 'უარყოფილი შეთავაზება'
      case 'EXPIRED':
        return 'ვადაგასული შეთავაზება'
      case 'ACCEPTED':
        return 'დადასტურებული შეთავაზება'
      default:
        return status
    }
  }
  // eslint-disable-next-line no-console
  console.log('[user-dashboard] userLeadOffers', userLeadOffers)
  const hasUserLeadOffers = userLeadOffers.length > 0
  const selectedCompareOffers = compareIndices
    .map((index) => userLeadOffers[index])
    .filter((offer): offer is UserLeadOffer => Boolean(offer))

  return (
    <>
      <motion.div
        {...getSectionMotionProps(0)}
        role="region"
        aria-label="User open requests and price quotes"
      >
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="mdi:clipboard-text-clock" className="h-5 w-5" />
              გახსნილი მოთხოვნები / ფასის კოტაციები
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userLeadOffersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            ) : userLeadOffersError ? (
              <p className="text-sm text-red-500">{userLeadOffersError}</p>
            ) : !hasUserLeadOffers ? (
              <p className="text-sm text-muted-foreground">
                ამ ეტაპზე არ გაქვთ გახსნილი მოთხოვნები. დაიწყეთ თანამშრომლობა კომპანიის გვერდიდან.
              </p>
            ) : (
              <div className="space-y-2">
                {userLeadOffers.map((offer, index) => {
                  const estimatedMin = Number(offer.estimatedTotalUsd)
                  const estimatedMax = Number(offer.estimatedTotalUsdMax)
                  const serviceFee = Number(offer.serviceFeeUsd)
                  const car = mockCars.find((mockCar) => mockCar.companyId === String(offer.companyId))

                  return (
                    <motion.div
                      key={offer.offerId}
                      className="flex w-full cursor-pointer items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      onClick={() => {
                        // Handle click if needed
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {car ? (
                          <img
                            src={car.imageUrl}
                            alt={`${car.make} ${car.model}`}
                            className="h-12 w-16 rounded-md object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-16 flex-col items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground gap-0.5">
                            <Icon icon="mdi:image-off-outline" className="h-4 w-4" />
                            <span className="line-clamp-1">{offer.companyName}</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">{offer.companyName}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            რეიტინგი: {offer.companyRating}{' '}
                            {typeof offer.companyCompletedDeals === 'number'
                              ? `• გარიგებები: ${offer.companyCompletedDeals}`
                              : null}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            ჯამური ბიუჯეტი:{' '}
                            {Number.isFinite(estimatedMin) && Number.isFinite(estimatedMax)
                              ? `$${estimatedMin.toLocaleString()} - $${estimatedMax.toLocaleString()}`
                              : 'n/a'}
                            {Number.isFinite(serviceFee)
                              ? ` • სერვის-ფი: $${serviceFee.toLocaleString()}`
                              : ''}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            სავარაუდო ვადა: {offer.estimatedDurationDays} დღე
                          </span>
                          {offer.comment && (
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {offer.comment}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          data-status={offer.status}
                        >
                          <span className="mr-1 flex h-1.5 w-1.5 rounded-full bg-primary" />
                          {getOfferStatusLabel(offer.status)}
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 h-7 px-2 text-[11px]"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActiveDialogOffer(offer)
                            }}
                          >
                            <Icon icon="mdi:message-text-outline" className="h-3 w-3" />
                            დიალოგის ნახვა
                          </Button>
                          <Button
                            size="sm"
                            variant={compareIndices.includes(index) ? 'default' : 'outline'}
                            className="flex items-center gap-1 h-7 px-2 text-[11px]"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setCompareIndices((prev) => {
                                const exists = prev.includes(index)
                                if (exists) {
                                  return prev.filter((value) => value !== index)
                                }

                                if (prev.length >= 3) {
                                  return prev
                                }

                                return [...prev, index]
                              })
                            }}
                          >
                            <Icon icon="mdi:compare-horizontal" className="h-3 w-3" />
                            {compareIndices.includes(index) ? 'შედარებიდან ამოღება' : 'შედარება'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedCompareOffers.length > 0 && (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="flex items-center gap-2 h-8 px-3 text-[11px]"
            onClick={() => setIsCompareDialogOpen(true)}
          >
            <Icon icon="mdi:compare-horizontal" className="h-3 w-3" />
            შეთავაზებების შედარება ({selectedCompareOffers.length}/3)
          </Button>
        </div>
      )}

      {activeDialogOffer && (
        <Dialog open onOpenChange={(open) => !open && setActiveDialogOffer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeDialogOffer.companyName}
              </DialogTitle>
              <DialogDescription>
                დეტალური ინფორმაცია კომპანიის შეთავაზებაზე და პირობებზე.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                  ID: {activeDialogOffer.offerId} • Company ID: {activeDialogOffer.companyId}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {getOfferStatusLabel(activeDialogOffer.status)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">კომპანია</p>
                  <p className="text-sm font-medium">{activeDialogOffer.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    რეიტინგი: {activeDialogOffer.companyRating}{' '}
                    {typeof activeDialogOffer.companyCompletedDeals === 'number'
                      ? `• გარიგებები: ${activeDialogOffer.companyCompletedDeals}`
                      : null}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">ფინანსური პირობები</p>
                  <p className="text-sm">
                    ჯამური ბიუჯეტი:{' '}
                    <span className="font-medium">
                      {activeDialogOffer.estimatedTotalUsd} - {activeDialogOffer.estimatedTotalUsdMax} USD
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    სერვის-ფი: <span className="font-medium">{activeDialogOffer.serviceFeeUsd} USD</span>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">ვადა და პირობები</p>
                  <p className="text-sm">
                    სავარაუდო ვადა:{' '}
                    <span className="font-medium">{activeDialogOffer.estimatedDurationDays} დღე</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">ტექნიკური დეტალები</p>
                  <p className="text-xs text-muted-foreground">
                    Offer ID: <span className="font-mono text-[11px]">{activeDialogOffer.offerId}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Company ID: <span className="font-mono text-[11px]">{activeDialogOffer.companyId}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="font-mono text-[11px]">{activeDialogOffer.status}</span>
                  </p>
                </div>
              </div>

              {activeDialogOffer.comment && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">კომპანიის კომენტარი</p>
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {activeDialogOffer.comment}
                  </p>
                </div>
              )}

              <div className="pt-1 space-y-2">
                <p className="text-xs text-muted-foreground">
                  დემო ღილაკები იმისთვის, თუ რა ქმედებები შეიძლება იყოს ამ დიალოგში მომავალში.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:chat-outline" className="h-3 w-3" />
                    შეტყობინების დაწერა
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:phone-outline" className="h-3 w-3" />
                    საკონტაქტო ნომრის გაზიარება
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px] col-span-2"
                  >
                    <Icon icon="mdi:note-text-outline" className="h-3 w-3" />
                    დამატებითი კითხვების გამოგზავნა
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:check-circle-outline" className="h-3 w-3" />
                    შეთავაზების დადასტურება
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:close-circle-outline" className="h-3 w-3" />
                    შეთავაზების გაუქმება
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isCompareDialogOpen && selectedCompareOffers.length > 0 && (
        <Dialog open onOpenChange={(open) => !open && setIsCompareDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>შეთავაზებების შედარება</DialogTitle>
              <DialogDescription>
                მაქსიმუმ სამი შეთავაზება შედარებისთვის. ეს არის დემო-ვიუ, რეალური ლოგიკა დაემატება მოგვიანებით.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b text-left text-[11px] text-muted-foreground">
                    <th className="py-1 pr-3 font-medium">კომპანია</th>
                    <th className="py-1 pr-3 font-medium">ბიუჯეტი</th>
                    <th className="py-1 pr-3 font-medium">სერვის-ფი</th>
                    <th className="py-1 pr-3 font-medium">ვადა</th>
                    <th className="py-1 pr-3 font-medium">სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompareOffers.map((offer) => (
                    <tr key={offer.offerId} className="border-b last:border-0">
                      <td className="py-1 pr-3 whitespace-nowrap font-medium">
                        {offer.companyName}
                      </td>
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {offer.estimatedTotalUsd} - {offer.estimatedTotalUsdMax} USD
                      </td>
                      <td className="py-1 pr-3 whitespace-nowrap">{offer.serviceFeeUsd} USD</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{offer.estimatedDurationDays} დღე</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{getOfferStatusLabel(offer.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <motion.div
        {...getSectionMotionProps(1)}
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
        {...getSectionMotionProps(2)}
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
