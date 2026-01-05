import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { CompanyTile } from '@/components/dashboard/CompanyTile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { Company } from '@/types/api'

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

  const sortedFavorites = [...favoriteCompanies].sort((a, b) => b.rating - a.rating)
  const sortedRecentlyViewed = [...recentlyViewedCompanies].sort((a, b) => b.rating - a.rating)

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

        {/* 2. Favorites & Recent (Tabs) */}
        <motion.div {...getSectionMotionProps(1)}>
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

    </div>
  )
}
