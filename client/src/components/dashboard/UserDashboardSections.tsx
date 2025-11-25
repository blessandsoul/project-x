import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { CompanyTile } from '@/components/dashboard/CompanyTile'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  favoriteCompanies,
  recentlyViewedCompanies,
  activityStats,
  userLeadOffers,
  userLeadOffersLoading,
  userLeadOffersError,
  mockGuides,
  mockOffers,
  quickService,
  quickGeography,
  quickBudget,
  availableServices,
  availableGeography,
  onQuickSearchSubmit,
  onQuickServiceChange,
  onQuickGeographyChange,
  onQuickBudgetChange,
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
      case 'SELECTED': return t('dashboard.user.offers.status.selected')
      case 'PENDING': return t('dashboard.user.offers.status.pending')
      case 'REJECTED': return t('dashboard.user.offers.status.rejected')
      case 'EXPIRED': return t('dashboard.user.offers.status.expired')
      case 'ACCEPTED': return t('dashboard.user.offers.status.accepted')
      default: return status
    }
  }

  const hasUserLeadOffers = userLeadOffers.length > 0
  const selectedCompareOffers = compareIndices
    .map((index) => userLeadOffers[index])
    .filter((offer): offer is UserLeadOffer => Boolean(offer))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Main Content (8/12) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* 1. Stats Summary Row - Ghost Style */}
        <motion.div {...getSectionMotionProps(0)}>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{activityStats.requestsCount}</p>
              <p className="text-xs text-muted-foreground font-medium">{t('dashboard.user.stats.requests')}</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{activityStats.favoritesCount}</p>
              <p className="text-xs text-muted-foreground font-medium">{t('dashboard.user.stats.favorites')}</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{activityStats.viewedCount}</p>
              <p className="text-xs text-muted-foreground font-medium">{t('dashboard.user.stats.viewed')}</p>
            </div>
          </div>
        </motion.div>

        {/* 2. Active Quotes - Minimal List */}
        <motion.div {...getSectionMotionProps(1)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                {t('dashboard.user.quotes.title')}
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                  {userLeadOffers.length}
                </span>
              </h2>
              {selectedCompareOffers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => setIsCompareDialogOpen(true)}
                >
                  <Icon icon="mdi:compare-horizontal" className="h-3 w-3" />
                  {t('dashboard.user.quotes.compare_selected', { count: selectedCompareOffers.length })}
                </Button>
              )}
            </div>

            {userLeadOffersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : userLeadOffersError ? (
              <p className="text-sm text-red-500 p-4 bg-red-50/50 rounded-lg border border-red-100">{userLeadOffersError}</p>
            ) : !hasUserLeadOffers ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed bg-muted/5">
                <Icon icon="mdi:clipboard-text-outline" className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.user.quotes.empty')}</p>
                <Button variant="link" className="text-xs mt-1 h-auto p-0 text-primary">
                  {t('dashboard.user.actions.fill_brief')}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40 border-t border-b border-border/40">
                {userLeadOffers.map((offer, index) => {
                  const estimatedMin = Number(offer.estimatedTotalUsd)
                  const estimatedMax = Number(offer.estimatedTotalUsdMax)
                  const car = mockCars.find((mockCar) => mockCar.companyId === String(offer.companyId))
                  const isSelected = compareIndices.includes(index)

                  return (
                    <div
                      key={offer.offerId}
                      className={`group relative flex flex-col sm:flex-row gap-4 py-4 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      {/* Selection Indicator (Left Border) */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}

                      {/* Image & Company */}
                      <div className="flex items-start gap-4 flex-1 px-2 sm:px-0">
                        <div className="shrink-0">
                           {car ? (
                            <img
                              src={car.imageUrl}
                              alt={offer.companyName}
                              className="h-12 w-16 rounded-md object-cover bg-muted shadow-sm"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted/50">
                              <Icon icon="mdi:domain" className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-foreground truncate">{offer.companyName}</p>
                            <span 
                              className={`inline-flex sm:hidden items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                offer.status === 'NEW' ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {getOfferStatusLabel(offer.status)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:star" className="h-3 w-3 text-yellow-400" />
                              <span className="tabular-nums text-foreground">{offer.companyRating}</span>
                            </span>
                            <span>•</span>
                            <span className="tabular-nums font-medium text-foreground">
                              {Number.isFinite(estimatedMin) ? `$${estimatedMin.toLocaleString()}` : 'N/A'} – {Number.isFinite(estimatedMax) ? `$${estimatedMax.toLocaleString()}` : 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="tabular-nums">{offer.estimatedDurationDays} {t('common.days')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions (Desktop: Right side, Mobile: Bottom row) */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 px-2 sm:px-0">
                         <span 
                            className={`hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              offer.status === 'NEW' ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {getOfferStatusLabel(offer.status)}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title={t('dashboard.user.quotes.view_dialog')}
                              onClick={() => setActiveDialogOffer(offer)}
                            >
                              <Icon icon="mdi:message-text-outline" className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${isSelected ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                              title={t('dashboard.user.quotes.compare')}
                              onClick={() => setCompareIndices(prev => 
                                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                              )}
                            >
                              <Icon icon={isSelected ? "mdi:checkbox-marked" : "mdi:plus-circle-outline"} className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* 3. Favorites & Recent (Tabs) */}
        <motion.div {...getSectionMotionProps(2)}>
           <Tabs defaultValue="favorites" className="w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <TabsList className="h-9 bg-muted/50 p-1">
                <TabsTrigger value="favorites" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('dashboard.user.favorites.title')}</TabsTrigger>
                <TabsTrigger value="recent" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('dashboard.user.recent.title')}</TabsTrigger>
              </TabsList>
              <Link to="/catalog" className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                {t('common.view_all')} <Icon icon="mdi:arrow-right" className="h-3 w-3" />
              </Link>
            </div>

            <TabsContent value="favorites" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedFavorites.length === 0 ? (
                   <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl border-dashed bg-muted/5">
                      <Icon icon="mdi:heart-outline" className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-sm">{t('dashboard.user.favorites.empty')}</p>
                   </div>
                ) : (
                  sortedFavorites.slice(0, 6).map(company => (
                    <CompanyTile key={company.id} company={company} />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedRecentlyViewed.length === 0 ? (
                   <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl border-dashed bg-muted/5">
                      <Icon icon="mdi:history" className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-sm">{t('dashboard.user.recent.empty')}</p>
                   </div>
                ) : (
                  sortedRecentlyViewed.slice(0, 6).map(company => (
                    <CompanyTile key={company.id} company={company} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Sidebar (4/12) */}
      <aside className="lg:col-span-4 space-y-8">
        {/* 4. Quick Search Widget - Natural Language Form */}
        <motion.div {...getSectionMotionProps(3)}>
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Icon icon="mdi:sparkles" className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.user.quick_search.title')}</span>
            </div>
            
            <form onSubmit={onQuickSearchSubmit} className="space-y-4">
              <div className="text-lg font-medium leading-relaxed">
                <span className="text-muted-foreground">{t('dashboard.user.quick_search.nl_prefix')}</span>
                <br />
                <select
                  className="bg-transparent border-b border-dashed border-foreground/30 text-foreground focus:outline-none focus:border-primary cursor-pointer py-0.5 pr-6 appearance-none w-full"
                  value={quickService}
                  onChange={(e) => onQuickServiceChange(e.target.value)}
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" className="text-muted-foreground">{t('dashboard.user.quick_search.any_service')}</option>
                  {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <br />
                <span className="text-muted-foreground">{t('dashboard.user.quick_search.nl_in')}</span>
                <br />
                <select
                  className="bg-transparent border-b border-dashed border-foreground/30 text-foreground focus:outline-none focus:border-primary cursor-pointer py-0.5 pr-6 appearance-none w-full"
                  value={quickGeography}
                  onChange={(e) => onQuickGeographyChange(e.target.value)}
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" className="text-muted-foreground">{t('dashboard.user.quick_search.any_location')}</option>
                  {availableGeography.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <br />
                <span className="text-muted-foreground">{t('dashboard.user.quick_search.nl_budget')}</span>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => onQuickBudgetChange('low')}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${quickBudget === 'low' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    &lt;4k
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickBudgetChange('medium')}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${quickBudget === 'medium' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    4-8k
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickBudgetChange('high')}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${quickBudget === 'high' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    &gt;8k
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 mt-2 shadow-sm font-medium" size="sm">
                <Icon icon="mdi:arrow-right" className="h-4 w-4 mr-2" />
                {t('dashboard.user.quick_search.submit')}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* 5. Quick Links / Actions - Clean List */}
        <motion.div {...getSectionMotionProps(4)}>
           <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 px-1">{t('dashboard.user.actions.title')}</h3>
           <div className="grid gap-2">
             <Link to="/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group border border-transparent hover:border-border/50">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Icon icon="mdi:magnify" className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('dashboard.user.actions.new_search')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.user.actions.new_search_desc')}</p>
                </div>
                <Icon icon="mdi:chevron-right" className="h-4 w-4 text-muted-foreground/50" />
             </Link>
             <Link to="/catalog" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group border border-transparent hover:border-border/50">
                <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Icon icon="mdi:text-box-outline" className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('dashboard.user.actions.fill_brief')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.user.actions.fill_brief_desc')}</p>
                </div>
                <Icon icon="mdi:chevron-right" className="h-4 w-4 text-muted-foreground/50" />
             </Link>
           </div>
        </motion.div>

        {/* 6. Guides & Resources - Minimal */}
        <motion.div {...getSectionMotionProps(5)}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 px-1 mt-6">{t('dashboard.user.guides.title')}</h3>
          <div className="space-y-3">
            {mockOffers.map(offer => (
              <div key={offer.id} className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-lg border border-amber-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:gift-outline" className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">{t('common.offer')}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-0.5">{offer.companyName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{offer.description}</p>
              </div>
            ))}
            <ul className="space-y-1">
              {mockGuides.map(guide => (
                <li key={guide.id}>
                  <Link to="#" className="block p-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors truncate">
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </aside>

      {/* DIALOGS */}
      {activeDialogOffer && (
        <Dialog open onOpenChange={(open) => !open && setActiveDialogOffer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeDialogOffer.companyName}</DialogTitle>
              <DialogDescription>{t('dashboard.user.quotes.dialog.description')}</DialogDescription>
            </DialogHeader>
             <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('dashboard.user.quotes.budget')}</p>
                     <p className="text-xl font-semibold tabular-nums">{activeDialogOffer.estimatedTotalUsd} – {activeDialogOffer.estimatedTotalUsdMax} <span className="text-sm text-muted-foreground font-normal">USD</span></p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('dashboard.user.quotes.duration_label')}</p>
                     <p className="text-xl font-semibold tabular-nums">{activeDialogOffer.estimatedDurationDays} <span className="text-sm text-muted-foreground font-normal">{t('common.days')}</span></p>
                  </div>
                </div>
                {activeDialogOffer.comment && (
                  <div className="relative pl-4 border-l-2 border-muted">
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      "{activeDialogOffer.comment}"
                    </p>
                  </div>
                )}
             </div>
          </DialogContent>
        </Dialog>
      )}

      {isCompareDialogOpen && selectedCompareOffers.length > 0 && (
        <Dialog open onOpenChange={(open) => !open && setIsCompareDialogOpen(false)}>
           <DialogContent className="max-w-3xl">
             <DialogHeader>
               <DialogTitle>{t('dashboard.user.compare.title')}</DialogTitle>
             </DialogHeader>
             <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium text-muted-foreground w-1/3">{t('dashboard.user.compare.headers.company')}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t('dashboard.user.compare.headers.budget')}</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">{t('dashboard.user.compare.headers.duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCompareOffers.map(offer => (
                      <tr key={offer.offerId}>
                        <td className="py-3 font-medium">{offer.companyName}</td>
                        <td className="py-3 tabular-nums">{offer.estimatedTotalUsd} – {offer.estimatedTotalUsdMax} $</td>
                        <td className="py-3 tabular-nums">{offer.estimatedDurationDays} d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
