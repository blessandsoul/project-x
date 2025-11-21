import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Header from '@/components/Header/index.tsx'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SectionCards } from '@/components/section-cards'
import { DealerDashboardSections } from '@/components/dashboard/DealerDashboardSections'
import { CompanyDashboardSections, type CompanyLeadBubble } from '@/components/dashboard/CompanyDashboardSections'
import { UserDashboardSections } from '@/components/dashboard/UserDashboardSections'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { navigationItems } from '@/config/navigation'
import { mockCompanies } from '@/mocks/_mockData'
import type { UserRole } from '@/types/api'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/hooks/useAuth'
import { useCompanySearch } from '@/hooks/useCompanySearch'
import { fetchUserLeadOffers, type UserLeadOffer } from '@/api/userLeads'
import { fetchCompanyLeads } from '@/api/companyLeads'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { favorites, clearFavorites } = useFavorites()
  const favoriteCompanies = mockCompanies.filter((company) => favorites.includes(company.id))
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed()
  const recentlyViewedCompanies = mockCompanies.filter((company) => recentlyViewed.includes(company.id))
  const shouldReduceMotion = useReducedMotion()
  const { user, updateUser } = useAuth()
  const [localRole, setLocalRole] = useState<UserRole>('user')
  const role: UserRole = (user?.role as UserRole | undefined) ?? localRole
  const navigate = useNavigate()
  const { state, updateFilters, resetFilters } = useCompanySearch()

  const [quickService, setQuickService] = useState<string>('')
  const [quickGeography, setQuickGeography] = useState<string>('')
  const [quickBudget, setQuickBudget] = useState<'low' | 'medium' | 'high' | ''>('')

  const [userLeadOffers, setUserLeadOffers] = useState<UserLeadOffer[]>([])
  const [isUserLeadOffersLoading, setIsUserLeadOffersLoading] = useState(false)
  const [userLeadOffersError, setUserLeadOffersError] = useState<string | null>(null)

  const [companyLeads, setCompanyLeads] = useState<CompanyLeadBubble[]>([])
  const [isCompanyLeadsLoading, setIsCompanyLeadsLoading] = useState(false)
  const [companyLeadsError, setCompanyLeadsError] = useState<string | null>(null)

  const isDashboardLoading = false
  const dashboardError: string | null = null

  useEffect(() => {
    if (role !== 'user') {
      return
    }

    let isMounted = true

    const loadUserLeadOffers = async () => {
      setIsUserLeadOffersLoading(true)
      setUserLeadOffersError(null)

      try {
        const offers = await fetchUserLeadOffers()
        if (!isMounted) return
        setUserLeadOffers(offers)
      } catch (error) {
        if (!isMounted) return
        // eslint-disable-next-line no-console
        console.error('[dashboard] fetchUserLeadOffers:error', error)
        setUserLeadOffersError(t('dashboard.error.quotes'))
      } finally {
        if (isMounted) {
          setIsUserLeadOffersLoading(false)
        }
      }
    }

    loadUserLeadOffers()

    return () => {
      isMounted = false
    }
  }, [role, t])

  useEffect(() => {
    if (role !== 'company') {
      return
    }

    let isMounted = true

    const loadCompanyLeads = async () => {
      setIsCompanyLeadsLoading(true)
      setCompanyLeadsError(null)

      try {
        const apiLeads = await fetchCompanyLeads()

        if (!isMounted) return

        const mapped: CompanyLeadBubble[] = apiLeads.map((item, index) => {
          const priority = item.leadSummary.priority ?? null

          return {
            id: String(item.leadCompanyId ?? `${item.leadId}-${index}`),
            leadId: item.leadId,
            status: item.status,
            invitedAt: item.invitedAt,
            expiresAt: item.expiresAt,
            priority,
            vehicle: {
              id: item.vehicle.id,
              title: item.vehicle.title,
              year: item.vehicle.year,
              imageUrl: item.vehicle.mainImageUrl,
            },
            summary: {
              budgetUsdMin: item.leadSummary.budgetUsdMin
                ? Number.parseFloat(item.leadSummary.budgetUsdMin)
                : null,
              budgetUsdMax: item.leadSummary.budgetUsdMax
                ? Number.parseFloat(item.leadSummary.budgetUsdMax)
                : null,
              desiredDurationDays: null,
              maxAcceptableDurationDays: null,
            },
          }
        })

        setCompanyLeads(mapped)
      } catch (error) {
        if (!isMounted) return
        // eslint-disable-next-line no-console
        console.error('[dashboard] fetchCompanyLeads:error', error)
        setCompanyLeadsError(t('dashboard.error.leads'))
      } finally {
        if (isMounted) {
          setIsCompanyLeadsLoading(false)
        }
      }
    }

    loadCompanyLeads()

    return () => {
      isMounted = false
    }
  }, [role, t])

  const handleQuickSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    resetFilters()

    const nextPriceRange = (() => {
      if (quickBudget === 'low') return [1000, 4000] as [number, number]
      if (quickBudget === 'medium') return [4000, 8000] as [number, number]
      if (quickBudget === 'high') return [8000, 15000] as [number, number]
      return state.filters.priceRange
    })()

    updateFilters({
      services: quickService ? [quickService] : state.filters.services,
      geography: quickGeography ? [quickGeography] : state.filters.geography,
      priceRange: nextPriceRange,
    })

    navigate('/catalog')
  }

  const recommendedCompanies = useMemo(
    () =>
      [...mockCompanies]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6),
    [],
  )

  const activityStats = useMemo(
    () => ({
      viewedCount: recentlyViewed.length,
      favoritesCount: favorites.length,
      requestsCount: userLeadOffers.length,
    }),
    [favorites.length, recentlyViewed.length, userLeadOffers.length],
  )

  const mockGuides = useMemo(
    () => [
      {
        id: 'guide-1',
        title: 'როგორ ავარჩიოთ სანდო იმპორტიორი აშშ-დან',
      },
      {
        id: 'guide-2',
        title: 'რა უნდა შევამოწმოთ კონტრაქტში ბოლომდე ხელმოწერამდე',
      },
      {
        id: 'guide-3',
        title: 'TOP შეცდომები, რომელსაც კლიენტები უშვებენ იმპორტის დროს',
      },
    ],
    [],
  )

  const mockOffers = useMemo(
    () =>
      mockCompanies
        .filter((company) => company.vipStatus)
        .slice(0, 3)
        .map((company) => ({
          id: `offer-${company.id}`,
          companyName: company.name,
          description: 'სპეციალური ფასი იმპორტზე მომდევნო 30 დღეში.',
        })),
    [],
  )

  const mockReminders = useMemo(
    () => {
      const reminders: { id: string; text: string; type: 'reviews' | 'offer' | 'favorites' }[] = []

      if (recentlyViewedCompanies.length > 0) {
        reminders.push({
          id: 'reminder-reviews',
          text: 'არ გაქვთ დათვალიერებული ბოლო ნანახი კომპანიის ყველა შეფასება.',
          type: 'reviews',
        })
      }

      if (mockOffers.length > 0) {
        reminders.push({
          id: 'reminder-offer',
          text: 'თქვენ გაქვთ ჯერ კიდევ გასანახავი სპეციალური შეთავაზება ზოგიერთი კომპანიისგან.',
          type: 'offer',
        })
      }

      if (favorites.length === 0) {
        reminders.push({
          id: 'reminder-favorites',
          text: 'დაამატეთ თქვენთვის საინტერესო კომპანიები რჩეულებში, რომ სწრაფად დაბრუნდეთ მათზე.',
          type: 'favorites',
        })
      }

      return reminders
    },
    [favorites.length, mockOffers.length, recentlyViewedCompanies.length],
  )

  const dealerLeadsStats = useMemo(
    () => ({
      todayNew: 5,
      weekNew: 24,
      inProgress: 7,
      closed: 12,
    }),
    [],
  )

  const dealerFunnelStats = useMemo(
    () => ({
      profileViews: 120,
      requests: 18,
      deals: 4,
    }),
    [],
  )

  const dealerRequests = useMemo(
    () =>
      mockCompanies.slice(0, 5).map((company, index) => ({
        id: `lead-${company.id}-${index}`,
        companyName: company.name,
        clientName: `კლიენტი #${index + 1}`,
        status: index === 0 ? 'ახალი' : index < 3 ? 'მუშავდება' : 'დახურული',
      })),
    [],
  )

  const dealerLeadReminders = useMemo(
    () => {
      const reminders: { id: string; text: string }[] = []

      if (dealerLeadsStats.inProgress > 3) {
        reminders.push({
          id: 'dealer-reminder-slow',
          text: 'რამდენიმე ლიდი 24 საათზე მეტია პასუხს ელოდება. შეამოწმეთ სტატუსები.',
        })
      }

      if (dealerLeadsStats.todayNew > 0 && dealerLeadsStats.inProgress === 0) {
        reminders.push({
          id: 'dealer-reminder-no-notes',
          text: 'ამ დღის ახალი ლიდებისთვის ჯერ არ გაქვთ დამატებული კომენტარები.',
        })
      }

      return reminders
    },
    [dealerLeadsStats.inProgress, dealerLeadsStats.todayNew],
  )

  const dealerTopPromoted = useMemo(
    () =>
      mockCompanies
        .filter((company) => company.vipStatus)
        .slice(0, 3)
        .map((company) => ({
          id: `promo-${company.id}`,
          name: company.name,
          responses: company.reviewCount,
        })),
    [],
  )

  const dealerReviewsSummary = useMemo(
    () => {
      const allReviews = mockCompanies.flatMap((company) => company.reviews)

      if (allReviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          latestReviews: [],
        }
      }

      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = Math.round((totalRating / allReviews.length) * 10) / 10

      return {
        averageRating,
        totalReviews: allReviews.length,
        latestReviews: allReviews.slice(0, 3),
      }
    },
    [],
  )

  const dealerTrafficStats = useMemo(
    () => ({
      totalViews: 340,
      fromSearch: 220,
      fromCatalog: 80,
      fromOffers: 40,
    }),
    [],
  )

  const dealerTasksToday = useMemo(
    () => [
      'დაურეკეთ მთავარ კლიენტს და დაამტკიცეთ პირობები',
      'გაუგზავნეთ კომერციული წინადადება 2 ახალ ლიდს',
      'განაახლეთ ფასები პოპულარულ პოზიციებზე',
    ],
    [],
  )

  const dealerComparisonStats = useMemo(
    () => ({
      leadsDeltaPercent: 12,
      conversionDeltaPercent: -3,
      marginDeltaPercent: 5,
    }),
    [],
  )

  const companyNetworkStats = useMemo(
    () => ({
      totalProfileViews: 1250,
      dealersCount: 14,
      activeCompaniesCount: mockCompanies.length,
    }),
    [],
  )

  const companyDealerActivityByState = useMemo(
    () => {
      const byState = new Map<string, number>()

      mockCompanies.forEach((company) => {
        const state = company.location.state
        const current = byState.get(state) ?? 0
        byState.set(state, current + company.reviewCount)
      })

      return Array.from(byState.entries())
        .map(([state, leads]) => ({ state, leads }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5)
      },
    [],
  )

  const companyBrandHealth = useMemo(
    () => {
      const allReviews = mockCompanies.flatMap((company) => company.reviews)

      if (allReviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
        }
      }

      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = Math.round((totalRating / allReviews.length) * 10) / 10

      return {
        averageRating,
        totalReviews: allReviews.length,
      }
    },
    [],
  )

  const companyServiceQuality = useMemo(
    () => ({
      avgReplyMinutes: 90,
      handledPercent: 82,
    }),
    [],
  )

  const companyCampaigns = useMemo(
    () => [
      {
        id: 'camp-1',
        name: 'Q2 Brand Awareness',
        impressions: 42000,
        clicks: 3100,
        leads: 140,
      },
      {
        id: 'camp-2',
        name: 'Summer Import Promo',
        impressions: 28000,
        clicks: 2100,
        leads: 95,
      },
    ],
    [],
  )

  const companyAudienceSegments = useMemo(
    () => [
      {
        id: 'seg-1',
        label: 'თბილისი / სრული იმპორტი',
        sharePercent: 38,
      },
      {
        id: 'seg-2',
        label: 'ბათუმი / საბაჟო + მიწოდება',
        sharePercent: 24,
      },
      {
        id: 'seg-3',
        label: 'ქუთაისი / ბიუჯეტური იმპორტი',
        sharePercent: 18,
      },
    ],
    [],
  )

  const companyCompetitors = useMemo(
    () =>
      mockCompanies.slice(0, 5).map((company, index) => ({
        id: `competitor-${company.id}`,
        name: company.name,
        rating: company.rating,
        trend: index % 2 === 0 ? 'up' : 'down',
      })),
    [],
  )

  const companyAlerts = useMemo(
    () => {
      const alerts: { id: string; text: string; type: 'rating' | 'leads' }[] = []

      const lowRated = mockCompanies.filter((company) => company.rating < 4)
      if (lowRated.length > 0) {
        alerts.push({
          id: 'alert-rating-low',
          text: `რამდენიმე კომპანიას აქვს რეიტინგი 4.0-ზე ნაკლები (${lowRated.length}).`,
          type: 'rating',
        })
      }

      alerts.push({
        id: 'alert-leads-drop',
        text: 'ზოგიერთ რეგიონში მოთხოვნების რაოდენობა შემცირებულია წინა პერიოდთან შედარებით.',
        type: 'leads',
      })

      return alerts
    },
    [],
  )

  const companyNetworkActions = useMemo(
    () => [
      {
        id: 'action-add-dealer',
        label: 'ახალი დილერის დამატება',
        icon: 'mdi:account-multiple-plus',
      },
      {
        id: 'action-edit-terms',
        label: 'თანამშრომლობის პირობების შეცვლა',
        icon: 'mdi:file-document-edit-outline',
      },
      {
        id: 'action-disable-location',
        label: 'ერთ-ერთი ლოკაციის დროებითი გათიშვა',
        icon: 'mdi:store-off-outline',
      },
    ],
    [],
  )

  const companyGoals = useMemo(
    () => [
      {
        id: 'goal-leads',
        label: 'მოთხოვნების რაოდენობის +20% ზრდა',
        progressPercent: 45,
      },
      {
        id: 'goal-rating',
        label: 'საშუალო რეიტინგის 4.5-მდე გაზრდა',
        progressPercent: 60,
      },
      {
        id: 'goal-coverage',
        label: 'გეოგრაფიული დაფარვის გაფართოება 3 ახალი შტატით',
        progressPercent: 30,
      },
    ],
    [],
  )

  const getSectionMotionProps = (index: number) => {
    if (shouldReduceMotion) {
      return {}
    }

    const delay = index * 0.05

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25, ease: 'easeOut' as const, delay },
    }
  }

  const handleClearFavorites = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('ნამდვილად გსურთ რჩეული კომპანიების გასუფთავება?')
    ) {
      clearFavorites()
    }
  }

  const handleClearRecentlyViewed = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('ნამდვილად გსურთ ბოლოს ნახული კომპანიების ისტორიის გასუფთავება?')
    ) {
      clearRecentlyViewed()
    }
  }

  const renderRoleSections = () => {
    if (role === 'dealer') {
      return (
        <DealerDashboardSections
          dealerLeadsStats={dealerLeadsStats}
          dealerFunnelStats={dealerFunnelStats}
          dealerRequests={dealerRequests}
          dealerLeadReminders={dealerLeadReminders}
          dealerTopPromoted={dealerTopPromoted}
          dealerReviewsSummary={dealerReviewsSummary}
          dealerTrafficStats={dealerTrafficStats}
          dealerTasksToday={dealerTasksToday}
          dealerComparisonStats={dealerComparisonStats}
          getSectionMotionProps={getSectionMotionProps}
        />
      )
    }

    if (role === 'company') {
      return (
        <CompanyDashboardSections
          companyLeads={companyLeads}
          companyNetworkStats={companyNetworkStats}
          companyDealerActivityByState={companyDealerActivityByState}
          companyBrandHealth={companyBrandHealth}
          companyServiceQuality={companyServiceQuality}
          companyCampaigns={companyCampaigns}
          companyAudienceSegments={companyAudienceSegments}
          companyCompetitors={companyCompetitors}
          companyAlerts={companyAlerts}
          companyNetworkActions={companyNetworkActions}
          companyGoals={companyGoals}
          getSectionMotionProps={getSectionMotionProps}
        />
      )
    }

    return (
      <UserDashboardSections
        recommendedCompanies={recommendedCompanies}
        favoriteCompanies={favoriteCompanies}
        recentlyViewedCompanies={recentlyViewedCompanies}
        activityStats={activityStats}
        userLeadOffers={userLeadOffers}
        userLeadOffersLoading={isUserLeadOffersLoading}
        userLeadOffersError={userLeadOffersError}
        mockGuides={mockGuides}
        mockOffers={mockOffers}
        mockReminders={mockReminders}
        quickService={quickService}
        quickGeography={quickGeography}
        quickBudget={quickBudget}
        availableServices={state.filters.services}
        availableGeography={state.filters.geography}
        onQuickSearchSubmit={handleQuickSearchSubmit}
        onQuickServiceChange={setQuickService}
        onQuickGeographyChange={setQuickGeography}
        onQuickBudgetChange={(value) => setQuickBudget(value)}
        onClearFavorites={handleClearFavorites}
        onClearRecentlyViewed={handleClearRecentlyViewed}
        getSectionMotionProps={getSectionMotionProps}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={navigationItems}
      />
      <SidebarProvider>
        <AppSidebar className="top-14" />
        <SidebarInset>
          <header className="flex h-11 sm:h-12 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">
                      <span className="font-logo-bebas inline-flex items-baseline gap-1">
                        <span className="font-bold">Trusted</span>{' '}
                        <span className="font-normal">Importers.Ge</span>
                      </span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('dashboard.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex flex-1 flex-col" aria-label="Dashboard main content">
            {/* Dev: role switcher for quickly viewing different dashboards */}
            <div className="border-b px-4 py-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <Button
                variant={role === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (user) {
                    updateUser({
                      role: 'user',
                      dealerSlug: null,
                      companyId: null,
                      companySlug: null,
                    })
                  } else {
                    setLocalRole('user')
                  }
                }}
              >
                {t('dashboard.roles.user')}
              </Button>
              <Button
                variant={role === 'dealer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (user) {
                    updateUser({
                      role: 'dealer',
                      companyId: null,
                      companySlug: null,
                    })
                  } else {
                    setLocalRole('dealer')
                  }
                }}
              >
                {t('dashboard.roles.dealer')}
              </Button>
              <Button
                variant={role === 'company' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (user) {
                    updateUser({
                      role: 'company',
                      companyId: '1',
                      dealerSlug: null,
                    })
                  } else {
                    setLocalRole('company')
                  }
                }}
              >
                {t('dashboard.roles.company')}
              </Button>
            </div>
            {(() => {
              if (dashboardError) {
                return (
                  <div className="flex flex-1 items-center justify-center p-4">
                    <p className="text-sm text-red-500 text-center max-w-md">
                      {t('dashboard.error.load')}
                    </p>
                  </div>
                )
              }

              if (isDashboardLoading) {
                return (
                  <div
                    className="flex flex-1 flex-col gap-4 p-4"
                    aria-label="Dashboard loading"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                  </div>
                )
              }

              return (
                <div
                  className="flex flex-1 flex-col gap-4 p-4"
                  aria-label="Dashboard sections"
                >
                  <motion.div {...getSectionMotionProps(0)}>
                    <SectionCards role={role} />
                  </motion.div>

                  {renderRoleSections()}
                </div>
              )
            })()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
