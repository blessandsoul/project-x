import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { CompanyTile } from '@/components/dashboard/CompanyTile'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

import { mockCars } from '@/mocks/_mockData'
import type { Company } from '@/types/api'
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
  recommendedCompanies: _recommendedCompanies,
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
  const { t } = useTranslation()
  const [activeDialogOffer, setActiveDialogOffer] = useState<UserLeadOffer | null>(null)
  const [compareIndices, setCompareIndices] = useState<number[]>([])
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)

  const sortedFavorites = [...favoriteCompanies].sort((a, b) => b.rating - a.rating)
  const sortedRecentlyViewed = [...recentlyViewedCompanies].sort((a, b) => b.rating - a.rating)
  const getOfferStatusLabel = (status: string): string => {
    switch (status) {
      case 'SELECTED':
        return t('dashboard.user.offers.status.selected')
      case 'PENDING':
        return t('dashboard.user.offers.status.pending')
      case 'REJECTED':
        return t('dashboard.user.offers.status.rejected')
      case 'EXPIRED':
        return t('dashboard.user.offers.status.expired')
      case 'ACCEPTED':
        return t('dashboard.user.offers.status.accepted')
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
              {t('dashboard.user.quotes.title')}
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
                {t('dashboard.user.quotes.empty')}
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
                      className="flex w-full cursor-pointer items-center justify-between rounded-md border bg-background px-3 py-2 text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                            {t('dashboard.user.quotes.rating')}: {offer.companyRating}{' '}
                            {typeof offer.companyCompletedDeals === 'number'
                              ? `• ${t('dashboard.user.quotes.deals')}: ${offer.companyCompletedDeals}`
                              : null}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {t('dashboard.user.quotes.budget')}:{' '}
                            {Number.isFinite(estimatedMin) && Number.isFinite(estimatedMax)
                              ? `$${estimatedMin.toLocaleString()} - $${estimatedMax.toLocaleString()}`
                              : 'n/a'}
                            {Number.isFinite(serviceFee)
                              ? ` • ${t('dashboard.user.quotes.service_fee')}: $${serviceFee.toLocaleString()}`
                              : ''}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {t('dashboard.user.quotes.duration', { count: offer.estimatedDurationDays })}
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
                          <span className="me-1 flex h-1.5 w-1.5 rounded-full bg-primary" />
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
                            {t('dashboard.user.quotes.view_dialog')}
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
                            {compareIndices.includes(index) ? t('dashboard.user.quotes.remove_compare') : t('dashboard.user.quotes.compare')}
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
            {t('dashboard.user.quotes.compare_selected', { count: selectedCompareOffers.length })}
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
                {t('dashboard.user.quotes.dialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                  ID: {activeDialogOffer.offerId} • Company ID: {activeDialogOffer.companyId}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <span className="me-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {getOfferStatusLabel(activeDialogOffer.status)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.user.quotes.dialog.company')}</p>
                  <p className="text-sm font-medium">{activeDialogOffer.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.user.quotes.rating')}: {activeDialogOffer.companyRating}{' '}
                    {typeof activeDialogOffer.companyCompletedDeals === 'number'
                      ? `• ${t('dashboard.user.quotes.deals')}: ${activeDialogOffer.companyCompletedDeals}`
                      : null}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.user.quotes.dialog.financials')}</p>
                  <p className="text-sm">
                    {t('dashboard.user.quotes.budget')}:{' '}
                    <span className="font-medium">
                      {activeDialogOffer.estimatedTotalUsd} - {activeDialogOffer.estimatedTotalUsdMax} USD
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.user.quotes.service_fee')}: <span className="font-medium">{activeDialogOffer.serviceFeeUsd} USD</span>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.user.quotes.dialog.terms')}</p>
                  <p className="text-sm">
                    {t('dashboard.user.quotes.duration_label')}:{' '}
                    <span className="font-medium">{t('dashboard.user.quotes.duration', { count: activeDialogOffer.estimatedDurationDays })}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.user.quotes.dialog.tech_details')}</p>
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
                  <p className="text-xs font-semibold text-muted-foreground">{t('dashboard.user.quotes.dialog.comment')}</p>
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {activeDialogOffer.comment}
                  </p>
                </div>
              )}

              <div className="pt-1 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.user.quotes.dialog.demo_actions_hint')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:chat-outline" className="h-3 w-3" />
                    {t('dashboard.user.quotes.dialog.action.message')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:phone-outline" className="h-3 w-3" />
                    {t('dashboard.user.quotes.dialog.action.contact')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px] col-span-2"
                  >
                    <Icon icon="mdi:note-text-outline" className="h-3 w-3" />
                    {t('dashboard.user.quotes.dialog.action.questions')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:check-circle-outline" className="h-3 w-3" />
                    {t('dashboard.user.quotes.dialog.action.accept')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 justify-start gap-1 px-2 text-[11px]"
                  >
                    <Icon icon="mdi:close-circle-outline" className="h-3 w-3" />
                    {t('dashboard.user.quotes.dialog.action.reject')}
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
              <DialogTitle>{t('dashboard.user.compare.title')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.user.compare.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b text-start text-[11px] text-muted-foreground">
                    <th className="py-1 px-3 font-medium text-start">{t('dashboard.user.compare.headers.company')}</th>
                    <th className="py-1 px-3 font-medium text-start">{t('dashboard.user.compare.headers.budget')}</th>
                    <th className="py-1 px-3 font-medium text-start">{t('dashboard.user.compare.headers.service_fee')}</th>
                    <th className="py-1 px-3 font-medium text-start">{t('dashboard.user.compare.headers.duration')}</th>
                    <th className="py-1 px-3 font-medium text-start">{t('dashboard.user.compare.headers.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompareOffers.map((offer) => (
                    <tr key={offer.offerId} className="border-b last:border-0">
                      <td className="py-1 px-3 whitespace-nowrap font-medium text-start">
                        {offer.companyName}
                      </td>
                      <td className="py-1 px-3 whitespace-nowrap text-start">
                        {offer.estimatedTotalUsd} - {offer.estimatedTotalUsdMax} USD
                      </td>
                      <td className="py-1 px-3 whitespace-nowrap text-start">{offer.serviceFeeUsd} USD</td>
                      <td className="py-1 px-3 whitespace-nowrap text-start">{offer.estimatedDurationDays} {t('common.days')}</td>
                      <td className="py-1 px-3 whitespace-nowrap text-start">{getOfferStatusLabel(offer.status)}</td>
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
                {t('dashboard.user.quick_search.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-3" onSubmit={onQuickSearchSubmit}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-service">
                    {t('dashboard.user.quick_search.service')}
                  </label>
                  <select
                    id="quick-service"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={quickService}
                    onChange={(event) => onQuickServiceChange(event.target.value)}
                  >
                    <option value="">{t('dashboard.user.quick_search.any')}</option>
                    {availableServices.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-geography">
                    {t('dashboard.user.quick_search.geography')}
                  </label>
                  <select
                    id="quick-geography"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={quickGeography}
                    onChange={(event) => onQuickGeographyChange(event.target.value)}
                  >
                    <option value="">{t('dashboard.user.quick_search.any')}</option>
                    {availableGeography.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{t('dashboard.user.quick_search.budget')}</span>
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
                    {t('dashboard.user.quick_search.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:flash" className="h-5 w-5" />
                {t('dashboard.user.actions.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/search">
                  <Icon icon="mdi:magnify" className="h-4 w-4" />
                  {t('dashboard.user.actions.new_search')}
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/catalog">
                  <Icon icon="mdi:send-circle-outline" className="h-4 w-4" />
                  {t('dashboard.user.actions.fill_brief')}
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2" variant="outline">
                <Link to="/dashboard">
                  <Icon icon="mdi:message-text-outline" className="h-4 w-4" />
                  {t('dashboard.user.actions.go_to_requests')}
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
            <CardTitle className="text-lg font-semibold">{t('dashboard.user.favorites.title')}</CardTitle>
            {favoriteCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFavorites}
                className="flex items-center gap-1 text-xs"
                motionVariant="scale"
              >
                <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                {t('dashboard.user.favorites.clear')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sortedFavorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.user.favorites.empty')}
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
            <CardTitle className="text-lg font-semibold">{t('dashboard.user.recent.title')}</CardTitle>
            {recentlyViewedCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRecentlyViewed}
                className="flex items-center gap-1 text-xs"
                motionVariant="scale"
              >
                <Icon icon="mdi:history" className="h-4 w-4" />
                {t('dashboard.user.recent.clear')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sortedRecentlyViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.user.recent.empty')}
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
                {t('dashboard.user.stats.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold">{activityStats.viewedCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.user.stats.viewed')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activityStats.favoritesCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.user.stats.favorites')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activityStats.requestsCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.user.stats.requests')}</p>
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
                {t('dashboard.user.guides.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockGuides.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.user.guides.empty')}
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {mockGuides.map((guide) => (
                    <li key={guide.id} className="flex items-center justify-between gap-2">
                      <span className="line-clamp-2">{guide.title}</span>
                      <Button size="sm" variant="link" className="px-0 text-xs">
                        {t('dashboard.user.guides.read')}
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
                {t('dashboard.user.offers.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.user.offers.empty')}
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
                        {t('dashboard.user.offers.view')}
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
              {t('dashboard.user.reminders.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.user.reminders.empty')}
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
