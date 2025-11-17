import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies, mockNavigationItems } from '@/mocks/_mockData'
import type { UserRole } from '@/mocks/_mockData'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/hooks/useAuth'
import { useCompanySearch } from '@/hooks/useCompanySearch'

export default function DashboardPage() {
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

    navigate('/search')
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
      requestsCount: 0,
    }),
    [favorites.length, recentlyViewed.length],
  )

  const mockOpenRequests = useMemo(
    () =>
      recentlyViewedCompanies.slice(0, 4).map((company, index) => ({
        id: `${company.id}-${index}`,
        companyName: company.name,
        status: index % 2 === 0 ? 'ველოდებით პასუხს' : 'საპასუხო შეთავაზება მიღებულია',
      })),
    [recentlyViewedCompanies],
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

  const renderRoleSections = () => {
    if (role === 'dealer') {
      return (
        <>
          <motion.div {...getSectionMotionProps(0)}>
            <div className="grid gap-4 md:grid-cols-3 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:account-group" className="h-5 w-5" />
                    ლიდების პანელი
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">ახალი დღეს</p>
                      <p className="text-xl font-semibold">{dealerLeadsStats.todayNew}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ახალი ამ კვირაში</p>
                      <p className="text-xl font-semibold">{dealerLeadsStats.weekNew}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">მუშავდება</p>
                      <p className="text-xl font-semibold">{dealerLeadsStats.inProgress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">დახურული</p>
                      <p className="text-xl font-semibold">{dealerLeadsStats.closed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:chart-timeline-variant" className="h-5 w-5" />
                    გაყიდვების ვორონკა
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">პროფილის ნახვები</span>
                      <span className="font-medium">{dealerFunnelStats.profileViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">მოთხოვნები</span>
                      <span className="font-medium">{dealerFunnelStats.requests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">დადებული გარიგებები</span>
                      <span className="font-medium">{dealerFunnelStats.deals}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:flash" className="h-5 w-5" />
                    სწრაფი მოქმედებები
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <Button asChild className="justify-start gap-2" variant="outline">
                    <Link to="/catalog">
                      <Icon icon="mdi:plus-circle-outline" className="h-4 w-4" />
                      ახალი შეთავაზების დამატება
                    </Link>
                  </Button>
                  <Button asChild className="justify-start gap-2" variant="outline">
                    <Link to="/dashboard">
                      <Icon icon="mdi:bullhorn-outline" className="h-4 w-4" />
                      აქციის გაშვება
                    </Link>
                  </Button>
                  <Button asChild className="justify-start gap-2" variant="outline">
                    <Link to="/catalog">
                      <Icon icon="mdi:cash-sync" className="h-4 w-4" />
                      ფასების განახლება
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(1)}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:inbox-arrow-down" className="h-5 w-5" />
                    ახალი კლიენტების მოთხოვნები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dealerRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ამ ეტაპზე არ გაქვთ ახალი მოთხოვნები.
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {dealerRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium line-clamp-1">{request.clientName}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {request.companyName}
                            </span>
                            <span className="text-xs text-muted-foreground">სტატუსი: {request.status}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <Icon icon="mdi:reply-outline" className="h-3 w-3" />
                              პასუხის გაცემა
                            </Button>
                            <Button size="sm" variant="ghost" className="flex items-center gap-1">
                              <Icon icon="mdi:check-circle-outline" className="h-3 w-3" />
                              დამუშავებულია
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:bell-outline" className="h-5 w-5" />
                    შეხსენებები ლიდებზე
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dealerLeadReminders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ამ დროისთვის არ გაქვთ კრიტიკული შეხსენებები.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {dealerLeadReminders.map((reminder) => (
                        <li
                          key={reminder.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Icon icon="mdi:alert-outline" className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{reminder.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(2)}>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:star-circle-outline" className="h-5 w-5" />
                    ტოპ შეთავაზებები / პოზიციები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dealerTopPromoted.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ჯერ არ გაქვთ გამოკვეთილი ტოპ შეთავაზებები.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {dealerTopPromoted.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span className="line-clamp-1">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.responses} გამოხმაურება
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:star-outline" className="h-5 w-5" />
                    კლიენტების შეფასებები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">{dealerReviewsSummary.averageRating}</span>
                    <span className="text-xs text-muted-foreground">
                      / 5 ({dealerReviewsSummary.totalReviews} შეფასება)
                    </span>
                  </div>
                  {dealerReviewsSummary.latestReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ჯერ არ გაქვთ შეფასებები.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {dealerReviewsSummary.latestReviews.map((review) => (
                        <li key={review.id} className="rounded-md border px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium line-clamp-1">{review.userName}</span>
                            <span className="flex items-center gap-1 text-xs">
                              <Icon
                                icon="mdi:star"
                                className="h-3 w-3 text-yellow-400 fill-current"
                              />
                              {review.rating}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {review.comment}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Icon icon="mdi:comment-edit-outline" className="h-3 w-3" />
                      შეფასებების მართვა
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(3)}>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:chart-areaspline" className="h-5 w-5" />
                    ტრაფიკი დილერის პროფილზე
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">სულ ნახვები</span>
                      <span className="font-medium">{dealerTrafficStats.totalViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ძიების ბლოკიდან</span>
                      <span className="font-medium">{dealerTrafficStats.fromSearch}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">კატალოგიდან</span>
                      <span className="font-medium">{dealerTrafficStats.fromCatalog}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">აქციებიდან / შეთავაზებებიდან</span>
                      <span className="font-medium">{dealerTrafficStats.fromOffers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:checklist" className="h-5 w-5" />
                    დღევანდელი ამოცანები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dealerTasksToday.length === 0 ? (
                    <p className="text-sm text-muted-foreground">დღევანდელი ამოცანები არ არის დამატებული.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {dealerTasksToday.map((task) => (
                        <li
                          key={task}
                          className="flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Icon icon="mdi:checkbox-blank-circle-outline" className="h-3 w-3" />
                          <span className="line-clamp-2">{task}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(4)}>
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="mdi:chart-box-outline" className="h-5 w-5" />
                  შედარება წინა პერიოდთან
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">ლიდების რაოდენობა</p>
                    <p className="text-lg font-semibold">
                      {dealerComparisonStats.leadsDeltaPercent > 0 ? '+' : ''}
                      {dealerComparisonStats.leadsDeltaPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">კონვერსია გარიგებებში</p>
                    <p className="text-lg font-semibold">
                      {dealerComparisonStats.conversionDeltaPercent > 0 ? '+' : ''}
                      {dealerComparisonStats.conversionDeltaPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">საშ. მარჟა</p>
                    <p className="text-lg font-semibold">
                      {dealerComparisonStats.marginDeltaPercent > 0 ? '+' : ''}
                      {dealerComparisonStats.marginDeltaPercent}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )
    }

    if (role === 'company') {
      return (
        <>
          <motion.div {...getSectionMotionProps(0)}>
            <div className="grid gap-4 md:grid-cols-3 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:office-building-outline" className="h-5 w-5" />
                    ქსელის საერთო სტატისტიკა
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-semibold">{companyNetworkStats.totalProfileViews}</p>
                      <p className="text-xs text-muted-foreground">პროფილის ნახვები</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{companyNetworkStats.dealersCount}</p>
                      <p className="text-xs text-muted-foreground">აქტიური დილერი</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{companyNetworkStats.activeCompaniesCount}</p>
                      <p className="text-xs text-muted-foreground">აქტიური კომპანია</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:map-marker-radius-outline" className="h-5 w-5" />
                    დილერების აქტივობა შტატების მიხედვით
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyDealerActivityByState.length === 0 ? (
                    <p className="text-sm text-muted-foreground">აქტივობის მონაცემები ჯერ არ არის.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {companyDealerActivityByState.map((item) => (
                        <li
                          key={item.state}
                          className="flex items-center justify-between rounded-md border px-3 py-1.5"
                        >
                          <span className="line-clamp-1">{item.state}</span>
                          <span className="text-xs text-muted-foreground">{item.leads} ლიძე / აქტივობა</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:heart-pulse" className="h-5 w-5" />
                    Brand health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-semibold">{companyBrandHealth.averageRating}</p>
                    <p className="text-xs text-muted-foreground">/ 5 ({companyBrandHealth.totalReviews} შეფასება)</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    ბრენდის საერთო აღქმა ყველა ქსელის დილერის მიხედვით.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(1)}>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:headset" className="h-5 w-5" />
                    მომსახურების ხარისხი
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">საშ. რეაგირების დრო</p>
                      <p className="text-xl font-semibold">{companyServiceQuality.avgReplyMinutes} წთ</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">დამუშავებული მოთხოვნები</p>
                      <p className="text-xl font-semibold">{companyServiceQuality.handledPercent}%</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    მონაცემა ილუსტრირებულია, შემდგომში ჩანაცვლდება რეალური API მონაცემებით.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:bullhorn-outline" className="h-5 w-5" />
                    მარკეტინგული კამპანიები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyCampaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ამ დროისთვის აქტიური კამპანიები არ არის.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {companyCampaigns.map((campaign) => (
                        <li
                          key={campaign.id}
                          className="rounded-md border px-3 py-2 flex flex-col gap-1"
                        >
                          <span className="font-medium line-clamp-1">{campaign.name}</span>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Impr: {campaign.impressions.toLocaleString()}</span>
                            <span>Clicks: {campaign.clicks.toLocaleString()}</span>
                            <span>Leads: {campaign.leads}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(2)}>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:account-group-outline" className="h-5 w-5" />
                    აუდიტორიის სეგმენტები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyAudienceSegments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">სეგმენტაციის მონაცემები არ არის.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {companyAudienceSegments.map((segment) => (
                        <li
                          key={segment.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span className="line-clamp-2 mr-2">{segment.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {segment.sharePercent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:shield-search-outline" className="h-5 w-5" />
                    კონკურენტების მონიტორინგი
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyCompetitors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">კონკურენტების მონაცემები არ არის.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {companyCompetitors.map((competitor) => (
                        <li
                          key={competitor.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium line-clamp-1">{competitor.name}</span>
                            <span className="text-xs text-muted-foreground">რეიტინგი: {competitor.rating}</span>
                          </div>
                          <span className="flex items-center gap-1 text-xs">
                            <Icon
                              icon={competitor.trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'}
                              className="h-3 w-3"
                            />
                            {competitor.trend === 'up' ? 'ზრდა' : 'კლება'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(3)}>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:alert-outline" className="h-5 w-5" />
                    რისკები და ალერთები
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ამ დროისთვის რისკები არაა გამოვლენილი.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {companyAlerts.map((alert) => (
                        <li
                          key={alert.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Icon icon="mdi:alert-circle-outline" className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{alert.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:account-cog-outline" className="h-5 w-5" />
                    დილერული ქსელის მართვა
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {companyNetworkActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="justify-start gap-2 text-sm"
                    >
                      <Icon icon={action.icon} className="h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...getSectionMotionProps(4)}>
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="mdi:target-account" className="h-5 w-5" />
                  გეგმები და მიზნები
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ამ ეტაპზე მიზნები არ არის დაკონფიგურირებული.</p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {companyGoals.map((goal) => (
                      <li key={goal.id} className="space-y-1">
                        <p className="line-clamp-2">{goal.label}</p>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${goal.progressPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{goal.progressPercent}%</p>
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

    return (
      <>
        <motion.div {...getSectionMotionProps(0)}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-2">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="mdi:magnify" className="h-5 w-5" />
                  სწრაფი ძიება კომპანიების მიხედვით
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 md:grid-cols-3" onSubmit={handleQuickSearchSubmit}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="quick-service">
                      სერვისის კატეგორია
                    </label>
                    <select
                      id="quick-service"
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={quickService}
                      onChange={(event) => setQuickService(event.target.value)}
                    >
                      <option value="">არ აქვს მნიშვნელობა</option>
                      {state.filters.services.map((service) => (
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
                      onChange={(event) => setQuickGeography(event.target.value)}
                    >
                      <option value="">არ აქვს მნიშვნელობა</option>
                      {state.filters.geography.map((location) => (
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
                        onClick={() => setQuickBudget('low')}
                      >
                        &lt; 4 000$
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={quickBudget === 'medium' ? 'default' : 'outline'}
                        onClick={() => setQuickBudget('medium')}
                      >
                        4 000–8 000$
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={quickBudget === 'high' ? 'default' : 'outline'}
                        onClick={() => setQuickBudget('high')}
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

        <motion.div {...getSectionMotionProps(1)}>
          <Card className="mt-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="mdi:star-outline" className="h-5 w-5" />
                რეკომენდებული კომპანიები თქვენთვის
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერჯერობით რეკომენდაციები არ არის. დაიწყეთ ძიება, რათა შევძლოთ უკეთესი შეთავაზებების ჩვენება.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recommendedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      to={`/company/${company.id}`}
                      className="group block rounded-lg border bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {company.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon
                                icon="mdi:star"
                                className="h-3 w-3 text-yellow-400 fill-current"
                              />
                              {company.rating}
                            </span>
                            <span>• {company.location.city}</span>
                          </div>
                        </div>
                        <Icon
                          icon="mdi:chevron-right"
                          className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...getSectionMotionProps(2)}>
          <Card className="mt-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">რჩეული კომპანიები</CardTitle>
              {favoriteCompanies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFavorites}
                  className="flex items-center gap-1 text-xs"
                  motionVariant="scale"
                >
                  <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                  გასუფთავება
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {favoriteCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერ არ გაქვთ დამატებული რჩეული კომპანიები. გახსენით კატალოგი და შეინახეთ
                  საინტერესო კომპანიები.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {favoriteCompanies.map((company) => (
                    <Link
                      key={company.id}
                      to={`/company/${company.id}`}
                      className="group block rounded-lg border bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {company.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon
                                icon="mdi:star"
                                className="h-3 w-3 text-yellow-400 fill-current"
                              />
                              {company.rating}
                            </span>
                            <span>• {company.location.city}</span>
                          </div>
                        </div>
                        <Icon
                          icon="mdi:chevron-right"
                          className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...getSectionMotionProps(3)}>
          <Card className="mt-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">ბოლოს ნახული კომპანიები</CardTitle>
              {recentlyViewedCompanies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentlyViewed}
                  className="flex items-center gap-1 text-xs"
                  motionVariant="scale"
                >
                  <Icon icon="mdi:history" className="h-4 w-4" />
                  გასუფთავება
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentlyViewedCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერ არ გაქვთ ნანახი კომპანიების ისტორია ამ სესიაში. გახსენით რომელიმე კომპანიის გვერდი,
                  რომ ნახოთ ისინი აქ.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recentlyViewedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      to={`/company/${company.id}`}
                      className="group block rounded-lg border bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {company.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon
                                icon="mdi:star"
                                className="h-3 w-3 text-yellow-400 fill-current"
                              />
                              {company.rating}
                            </span>
                            <span>• {company.location.city}</span>
                          </div>
                        </div>
                        <Icon
                          icon="mdi:chevron-right"
                          className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...getSectionMotionProps(4)}>
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

        <motion.div {...getSectionMotionProps(5)}>
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
                    ამ მომენტში აქტიური სპეციალური შეთავაზებები არ არის. დაბრუნდით მოგვიანებით.
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

        <motion.div {...getSectionMotionProps(6)}>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
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
                      TrustedImporters.Ge
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
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
              მომხმარებელი
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
              დილერი
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
              კომპანია
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <motion.div {...getSectionMotionProps(0)}>
              <SectionCards role={role} />
            </motion.div>

            {renderRoleSections()}
          </div>
      </SidebarInset>
    </SidebarProvider>
    </div>
  )
}
