import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Header from '@/components/Header/index.tsx'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { navigationItems, footerLinks } from '@/config/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useVehicleDetails } from '@/hooks/useVehicleDetails'
import { useAuth } from '@/hooks/useAuth'
import type { VehicleQuote } from '@/types/vehicles'
import { VipBadge } from '@/components/company/VipBadge'
import QuoteBreakdownReceipt from '@/components/vehicle/QuoteBreakdownReceipt'
import { cn } from '@/lib/utils'
import { createLeadFromQuotes, type CreateLeadFromQuotesRequest } from '@/api/leads'

type QuoteWithVipMeta = { quote: VehicleQuote; index: number; vipLabel: string | null }

const LEAD_STATE_STORAGE_PREFIX = 'vehicle_lead_state_'

const VehicleDetailsPage = () => {
  const mockCompanies: { name: string; rating: number; reviewCount: number; slug?: string }[] = []
  const mockRecentCases: { id: string; make: string; model: string; from: string; to: string; days: number }[] = []
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const params = useParams<{ id: string }> ()
  const offersRef = useRef<HTMLDivElement | null>(null)
  const breakdownCloseTimeoutRef = useRef<number | null>(null)
  const orderCloseTimeoutRef = useRef<number | null>(null)
  const successCloseTimeoutRef = useRef<number | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isImageFading, setIsImageFading] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [thumbPage, setThumbPage] = useState(0)
  const [activeBreakdownQuote, setActiveBreakdownQuote] = useState<VehicleQuote | null>(null)
  const [isBreakdownEntering, setIsBreakdownEntering] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<VehicleQuote | null>(null)
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false)
  const [isOrderPopupEntering, setIsOrderPopupEntering] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isSuccessEntering, setIsSuccessEntering] = useState(false)
  const [orderName, setOrderName] = useState('')
  const [orderPhone, setOrderPhone] = useState('')
  const [orderComment, setOrderComment] = useState('')
  const [leadPriority, setLeadPriority] = useState<'price'>('price')
  const [showOnlyPremium, setShowOnlyPremium] = useState(false)
  const [showOnlyStandard, setShowOnlyStandard] = useState(false)
  const [onlyHighRating, setOnlyHighRating] = useState(false)
  const [onlyFastDelivery, setOnlyFastDelivery] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [selectedCompanyNames, setSelectedCompanyNames] = useState<string[]>([])
  const [hasUnlockedExtraCompanies, setHasUnlockedExtraCompanies] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [supportLikeChecked, setSupportLikeChecked] = useState(false)
  const [supportReviewChecked, setSupportReviewChecked] = useState(false)
  const [supportReviewText, setSupportReviewText] = useState('')
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [, setIsLeadRulesModalOpen] = useState(false)
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const [isSupportUnlockSubmitting, setIsSupportUnlockSubmitting] = useState(false)
  const [budgetUsdMin, setBudgetUsdMin] = useState<string>('')
  const [budgetUsdMax, setBudgetUsdMax] = useState<string>('')
  const [desiredDurationDays, setDesiredDurationDays] = useState<string>('')
  const [maxAcceptableDurationDays, setMaxAcceptableDurationDays] = useState<string>('')
  const [damageTolerance, setDamageTolerance] = useState<'minimal' | 'moderate' | 'any' | ''>('')
  const [serviceExtras, setServiceExtras] = useState<string[]>([])
  const [preferredContactChannel, setPreferredContactChannel] = useState<
    'whatsapp' | 'telegram' | 'phone' | 'email' | ''
  >('')
  const { t } = useTranslation()
  const vehicleId = useMemo(() => {
    if (!params.id) return null
    const parsed = Number(params.id)
    return Number.isFinite(parsed) ? parsed : null
  }, [params.id])

  const { vehicle, photos, quotes, isLoading, error, recalculate, quotesPage, quotesTotalPages, setQuotesPage } =
    useVehicleDetails(vehicleId)

  const isInitialLoading = isLoading && !vehicle

  const prefersReducedMotion = useReducedMotion()

  const THUMBS_PER_PAGE = 3

  const totalThumbPages = useMemo(() => {
    if (photos.length <= 1) return 0
    return Math.ceil(photos.length / THUMBS_PER_PAGE)
  }, [photos.length])

  const clampedThumbPage = totalThumbPages > 0 ? Math.min(thumbPage, totalThumbPages - 1) : 0

  const thumbStartIndex = clampedThumbPage * THUMBS_PER_PAGE
  const visibleThumbs = photos.slice(thumbStartIndex, thumbStartIndex + THUMBS_PER_PAGE)

  // Keep quotes page in sync with URL (?page=N) so refresh/share preserves progress
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('page')
    const parsed = raw ? Number(raw) : 1
    const safePage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1

    if (safePage !== quotesPage) {
      setQuotesPage(safePage)
    }
  }, [location.search, quotesPage, setQuotesPage])

  useEffect(() => {
    if (!vehicleId) return

    try {
      const raw = window.localStorage.getItem(`${LEAD_STATE_STORAGE_PREFIX}${vehicleId}`)
      if (!raw) return

      const parsed = JSON.parse(raw) as {
        selectedCompanyNames?: string[]
        orderName?: string
        orderPhone?: string
        orderComment?: string
        budgetUsdMin?: string
        budgetUsdMax?: string
        desiredDurationDays?: string
        maxAcceptableDurationDays?: string
        damageTolerance?: 'minimal' | 'moderate' | 'any' | ''
        serviceExtras?: string[]
        preferredContactChannel?: 'whatsapp' | 'telegram' | 'phone' | 'email' | ''
      } | null

      if (!parsed) return

      if (Array.isArray(parsed.selectedCompanyNames)) {
        setSelectedCompanyNames(parsed.selectedCompanyNames)
      }
      if (typeof parsed.orderName === 'string') {
        setOrderName(parsed.orderName)
      }
      if (typeof parsed.orderPhone === 'string') {
        setOrderPhone(parsed.orderPhone)
      }
      if (typeof parsed.orderComment === 'string') {
        setOrderComment(parsed.orderComment)
      }
      if (typeof parsed.budgetUsdMin === 'string') {
        setBudgetUsdMin(parsed.budgetUsdMin)
      }
      if (typeof parsed.budgetUsdMax === 'string') {
        setBudgetUsdMax(parsed.budgetUsdMax)
      }
      if (typeof parsed.desiredDurationDays === 'string') {
        setDesiredDurationDays(parsed.desiredDurationDays)
      }
      if (typeof parsed.maxAcceptableDurationDays === 'string') {
        setMaxAcceptableDurationDays(parsed.maxAcceptableDurationDays)
      }
      if (parsed.damageTolerance === 'minimal' || parsed.damageTolerance === 'moderate' || parsed.damageTolerance === 'any' || parsed.damageTolerance === '') {
        setDamageTolerance(parsed.damageTolerance)
      }
      if (Array.isArray(parsed.serviceExtras)) {
        setServiceExtras(parsed.serviceExtras)
      }
      if (
        parsed.preferredContactChannel === 'whatsapp' ||
        parsed.preferredContactChannel === 'telegram' ||
        parsed.preferredContactChannel === 'phone' ||
        parsed.preferredContactChannel === 'email' ||
        parsed.preferredContactChannel === ''
      ) {
        setPreferredContactChannel(parsed.preferredContactChannel)
      }
    } catch {
      // ignore corrupted storage
    }
  }, [vehicleId])

  useEffect(() => {
    if (!vehicleId) return

    const payload = {
      selectedCompanyNames,
      orderName,
      orderPhone,
      orderComment,
      budgetUsdMin,
      budgetUsdMax,
      desiredDurationDays,
      maxAcceptableDurationDays,
      damageTolerance,
      serviceExtras,
      preferredContactChannel,
    }

    try {
      window.localStorage.setItem(
        `${LEAD_STATE_STORAGE_PREFIX}${vehicleId}`,
        JSON.stringify(payload),
      )
    } catch {
      // ignore storage write errors
    }
  }, [
    vehicleId,
    selectedCompanyNames,
    orderName,
    orderPhone,
    orderComment,
    budgetUsdMin,
    budgetUsdMax,
    desiredDurationDays,
    maxAcceptableDurationDays,
    damageTolerance,
    serviceExtras,
    preferredContactChannel,
  ])

  useEffect(() => {
    setActivePhotoIndex(0)
    setThumbPage(0)
  }, [vehicleId, photos.length])

  // On quotes page change, scroll offers section into view smoothly
  useEffect(() => {
    if (!offersRef.current) return
    offersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [quotesPage])

  useEffect(() => {
    if (!photos.length) return

    let timeout: number | null = null
    const frameId = window.requestAnimationFrame(() => {
      setIsImageFading(true)
      timeout = window.setTimeout(() => {
        setIsImageFading(false)
      }, 200)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      if (timeout != null) {
        window.clearTimeout(timeout)
      }
    }
  }, [activePhotoIndex, photos.length])

  const handleRecalculate = () => {
    setIsRecalculating(true)
    recalculate()
  }

  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen])

  const closeBreakdownPopup = () => {
    if (breakdownCloseTimeoutRef.current != null) {
      window.clearTimeout(breakdownCloseTimeoutRef.current)
      breakdownCloseTimeoutRef.current = null
    }

    breakdownCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveBreakdownQuote(null)
      setIsBreakdownEntering(false)
      breakdownCloseTimeoutRef.current = null
    }, 200)
  }

  useEffect(() => {
    if (!activeBreakdownQuote) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBreakdownPopup()
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsBreakdownEntering(true)
    })

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(frameId)
    }
  }, [activeBreakdownQuote])

  const sortedQuotes = useMemo<VehicleQuote[]>(() => {
    if (!quotes.length) return []

    const getTotalPriceNumeric = (quote: VehicleQuote): number => {
      const raw = quote.total_price as number | string
      const numeric = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(numeric) ? numeric : 0
    }

    return [...quotes].sort((a, b) => {
      const aPrice = getTotalPriceNumeric(a)
      const bPrice = getTotalPriceNumeric(b)

      if (aPrice !== bPrice) {
        return aPrice - bPrice
      }

      const aDays = a.delivery_time_days
      const bDays = b.delivery_time_days

      if (aDays == null && bDays == null) return 0
      if (aDays == null) return 1
      if (bDays == null) return -1

      return aDays - bDays
    })
  }, [quotes])

  const bestQuote = useMemo<VehicleQuote | null>(() => {
    if (!sortedQuotes.length) return null
    return sortedQuotes[0]
  }, [sortedQuotes])

  const averageTotalPrice = useMemo<number | null>(() => {
    if (!sortedQuotes.length) return null

    const sum = sortedQuotes.reduce((acc, quote) => {
      const raw = quote.total_price as number | string
      const numeric = typeof raw === 'number' ? raw : Number(raw)
      return acc + (Number.isFinite(numeric) ? numeric : 0)
    }, 0)

    return sum / sortedQuotes.length
  }, [sortedQuotes])

  const savingsAmount = useMemo<number | null>(() => {
    if (sortedQuotes.length < 2) return null

    const cheapestRaw = sortedQuotes[0]?.total_price as number | string
    const mostExpensiveRaw = sortedQuotes[sortedQuotes.length - 1]?.total_price as number | string

    const cheapest = typeof cheapestRaw === 'number' ? cheapestRaw : Number(cheapestRaw)
    const mostExpensive =
      typeof mostExpensiveRaw === 'number' ? mostExpensiveRaw : Number(mostExpensiveRaw)

    if (cheapest == null || mostExpensive == null) return null

    const diff = mostExpensive - cheapest
    return diff > 0 ? diff : null
  }, [sortedQuotes])

  const maxSelectableCompanies = hasUnlockedExtraCompanies ? 5 : 3

  const toggleSelectedCompany = (companyName: string) => {
    setSelectedCompanyNames((prev) => {
      const exists = prev.includes(companyName)
      if (exists) {
        return prev.filter((name) => name !== companyName)
      }

      if (prev.length >= maxSelectableCompanies) {
        if (!hasUnlockedExtraCompanies) {
          setIsSupportModalOpen(true)
        }

        return prev
      }

      const next = [...prev, companyName]

      if (!isAuthenticated && next.length === 2) {
        setIsLeadRulesModalOpen(true)
      }

      return next
    })
  }

  const handleSubmitLead = async (event: any) => {
    event.preventDefault()

    if (!vehicleId) {
      setLeadError(t('vehicle_details.errors.not_found'))
      return
    }

    const trimmedName = orderName.trim()
    const trimmedPhone = orderPhone.trim()

    if (!trimmedName || !trimmedPhone) {
      setLeadError(t('vehicle_details.errors.fill_name_phone'))
      return
    }

    if (trimmedPhone.length < 3) {
      setLeadError(t('vehicle_details.errors.phone_min_length'))
      return
    }

    if (selectedCompanyNames.length === 0) {
      setLeadError(t('vehicle_details.errors.select_min_one_company'))
      return
    }

    const parsedBudgetMin = budgetUsdMin.trim() ? Number(budgetUsdMin.trim()) : null
    const parsedBudgetMax = budgetUsdMax.trim() ? Number(budgetUsdMax.trim()) : null
    const parsedDesiredDuration = desiredDurationDays.trim()
      ? Number(desiredDurationDays.trim())
      : null
    const parsedMaxAcceptableDuration = maxAcceptableDurationDays.trim()
      ? Number(maxAcceptableDurationDays.trim())
      : null

    const selectedCompanyIds = selectedCompanyNames
      .map((name) => {
        const quote = quotes.find((q) => q.company_name === name)
        if (!quote) return null

        return quote.company_id
      })
      .filter((id): id is number => id != null)

    if (selectedCompanyIds.length === 0) {
      setLeadError(t('vehicle_details.errors.company_id_failed'))
      return
    }

    setIsLeadSubmitting(true)
    setLeadError(null)

    try {
      const payload: CreateLeadFromQuotesRequest = {
        vehicleId,
        selectedCompanyIds,
        name: trimmedName,
        contact: trimmedPhone,
        message: orderComment.trim(),
        priority: leadPriority,
        budgetUsdMin: Number.isFinite(parsedBudgetMin as number) ? parsedBudgetMin : null,
        budgetUsdMax: Number.isFinite(parsedBudgetMax as number) ? parsedBudgetMax : null,
        desiredDurationDays: Number.isFinite(parsedDesiredDuration as number)
          ? parsedDesiredDuration
          : null,
        maxAcceptableDurationDays: Number.isFinite(parsedMaxAcceptableDuration as number)
          ? parsedMaxAcceptableDuration
          : null,
        serviceExtras: serviceExtras.length > 0 ? serviceExtras : null,
      }

      if (damageTolerance) {
        payload.damageTolerance = damageTolerance
      }

      if (preferredContactChannel) {
        payload.preferredContactChannel = preferredContactChannel
      }

      await createLeadFromQuotes(payload)

      setIsLeadModalOpen(false)
      setSelectedCompanyNames([])
      setBudgetUsdMin('')
      setBudgetUsdMax('')
      setDesiredDurationDays('')
      setMaxAcceptableDurationDays('')
      setDamageTolerance('')
      setServiceExtras([])
      setPreferredContactChannel('')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('vehicle_details.errors.request_failed')
      setLeadError(message)
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  const updateQuotesPageInUrl = (nextPage: number) => {
    const params = new URLSearchParams(location.search)
    if (nextPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(nextPage))
    }

    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: false })
    setQuotesPage(nextPage)
  }

  const handlePrevQuotesPage = () => {
    if (quotesPage <= 1) return
    updateQuotesPageInUrl(quotesPage - 1)
  }

  const handleNextQuotesPage = () => {
    if (quotesPage >= quotesTotalPages) return
    updateQuotesPageInUrl(quotesPage + 1)
  }

  const handleContinueClick = () => {
    if (selectedCompanyNames.length === 0) {
      return
    }

    setIsLeadModalOpen(true)
  }

  const handleSendClick = () => {
    if (selectedCompanyNames.length === 0 || isLeadSubmitting) {
      return
    }

    if (isAuthenticated) {
      handleContinueClick()
      return
    }

    setIsLeadRulesModalOpen(true)
  }

  const getShippingPriceColorClass = (
    quote: VehicleQuote,
    referenceBestQuote: VehicleQuote | null,
    isDiscounted: boolean,
  ): string => {
    if (referenceBestQuote && quote.company_name === referenceBestQuote.company_name) {
      return 'text-emerald-600'
    }

    if (isDiscounted) {
      return 'text-amber-600'
    }

    return 'text-red-600'
  }

  const getVipLabelForIndex = (index: number): string | null => {
    if (index === 0) return t('featured_companies.vip_diamond')
    if (index === 1) return t('featured_companies.vip_gold')
    if (index === 2) return t('featured_companies.vip_silver')
    return null
  }

  const premiumQuotes: QuoteWithVipMeta[] = []
  const standardQuotes: QuoteWithVipMeta[] = []

  sortedQuotes.forEach((quote, index) => {
    const vipLabel = getVipLabelForIndex(index)
    const target = vipLabel ? premiumQuotes : standardQuotes
    target.push({ quote, index, vipLabel })
  })

  // const openOrderPopupForQuote = (quote: VehicleQuote) => {
  //   setSelectedQuote(quote)
  //   setIsOrderPopupOpen(true)
  // }

  const handleSubmitOrder = (event: React.FormEvent) => {
    event.preventDefault()
    closeOrderPopup()
    setOrderName('')
    setOrderPhone('')
    setOrderComment('')

    if (selectedQuote) {
      setIsSuccessModalOpen(true)
    }
  }

  const handleScrollToOffers = () => {
    if (offersRef.current) {
      offersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const closeSuccessModal = () => {
    if (successCloseTimeoutRef.current != null) {
      window.clearTimeout(successCloseTimeoutRef.current)
      successCloseTimeoutRef.current = null
    }

    setIsSuccessEntering(false)

    successCloseTimeoutRef.current = window.setTimeout(() => {
      setIsSuccessModalOpen(false)
      successCloseTimeoutRef.current = null
    }, 200)
  }

  const closeOrderPopup = () => {
    if (orderCloseTimeoutRef.current != null) {
      window.clearTimeout(orderCloseTimeoutRef.current)
      orderCloseTimeoutRef.current = null
    }

    setIsOrderPopupEntering(false)

    orderCloseTimeoutRef.current = window.setTimeout(() => {
      setIsOrderPopupOpen(false)
      orderCloseTimeoutRef.current = null
    }, 200)
  }

  useEffect(() => {
    const state = (location.state as { scrollToOffers?: boolean } | null) || null
    if (!state || !state.scrollToOffers) return
    if (isLoading || error) return

    if (offersRef.current) {
      offersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    navigate(location.pathname, { replace: true })
  }, [location, isLoading, error, navigate])

  useEffect(() => {
    if (!isSuccessModalOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsSuccessEntering(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isSuccessModalOpen])

  useEffect(() => {
    if (!isOrderPopupOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsOrderPopupEntering(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isOrderPopupOpen])

  useEffect(() => {
    return () => {
      if (breakdownCloseTimeoutRef.current != null) {
        window.clearTimeout(breakdownCloseTimeoutRef.current)
      }
      if (orderCloseTimeoutRef.current != null) {
        window.clearTimeout(orderCloseTimeoutRef.current)
      }
      if (successCloseTimeoutRef.current != null) {
        window.clearTimeout(successCloseTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isRecalculating) return

    if (!isLoading) {
      const timeoutId = window.setTimeout(() => {
        setIsRecalculating(false)
      }, 500)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isLoading, isRecalculating])

  useEffect(() => {
    if (!quotes.length) return
    if (selectedQuote) return

    const searchParams = new URLSearchParams(location.search)
    const companyFromQuery = searchParams.get('company')

    if (!companyFromQuery) return

    const foundQuote = quotes.find((quote) => quote.company_name === companyFromQuery)

    if (!foundQuote) return

    let frameId: number | null = null
    frameId = window.requestAnimationFrame(() => {
      setSelectedQuote(foundQuote)
    })

    return () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [location.search, quotes, selectedQuote])

  const formatMoney = (value: number | string | null | undefined): string | null => {
    if (value == null) return null

    const numeric = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numeric)) return null

    return `$${numeric.toLocaleString()} USD`
  }

  const formatMileage = (value: number | string | null | undefined): string | null => {
    if (value == null) return null

    const cleaned = typeof value === 'number' ? String(value) : String(value).replace(/[^0-9.-]/g, '')
    const numeric = Number(cleaned)
    if (!Number.isFinite(numeric)) return null

    return `${numeric.toLocaleString()} km`
  }

  const formatAuctionSource = (value: string | null | undefined): string | null => {
    if (!value) return null

    const trimmed = value.trim()
    const lower = trimmed.toLowerCase()

    if (lower === 'copart') return 'COPART'
    if (lower === 'iaai') return 'IAAI'

    return trimmed
  }

  const formatDateTime = (
    dateValue: string | null | undefined,
    timeValue?: string | null | undefined,
  ): string | null => {
    if (!dateValue && !timeValue) return null

    if (dateValue) {
      const date = new Date(dateValue)
      if (Number.isNaN(date.getTime())) {
        return timeValue ? timeValue : dateValue
      }

      const datePart = date.toLocaleDateString('ka-GE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      if (timeValue) {
        return `${datePart} · ${timeValue}`
      }

      return datePart
    }

    return timeValue || null
  }

  const handleOpenCompanyPage = (quote: VehicleQuote) => {
    const companyMeta = mockCompanies.find((company: any) => company.name === quote.company_name)

    if (companyMeta && 'slug' in companyMeta && companyMeta.slug) {
      navigate(`/companies/${String((companyMeta as any).slug)}`)
      return
    }

    navigate(`/companies?name=${encodeURIComponent(quote.company_name)}`)
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header
        user={null}
        navigationItems={navigationItems}
      />
      <main className="flex-1 w-full overflow-x-hidden" role="main" aria-label={t('vehicle_details.title')}>
        <div className="container mx-auto max-w-6xl px-2 sm:px-4 lg:px-6 py-8">
          {isSupportModalOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('vehicle_details.support_modal.aria_label')}
              onClick={() => setIsSupportModalOpen(false)}
            >
              <div
                className="relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                  onClick={() => setIsSupportModalOpen(false)}
                  aria-label={t('vehicle_details.support_modal.close_aria')}
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </button>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-base font-semibold mb-1">{t('vehicle_details.support_modal.title')}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('vehicle_details.support_modal.description')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <Icon icon="mdi:instagram" className="h-3 w-3" />
                      Instagram
                    </a>
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <Icon icon="mdi:facebook" className="h-3 w-3" />
                      Facebook
                    </a>
                    <a
                      href="https://www.youtube.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <Icon icon="mdi:youtube" className="h-3 w-3" />
                      YouTube
                    </a>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={supportLikeChecked}
                        onChange={(event) => setSupportLikeChecked(event.target.checked)}
                      />
                      <span>{t('vehicle_details.support_modal.liked_project')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={supportReviewChecked}
                        onChange={(event) => setSupportReviewChecked(event.target.checked)}
                      />
                      <span>{t('vehicle_details.support_modal.ready_to_review')}</span>
                    </label>
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium">{t('vehicle_details.support_modal.your_review_label')}</div>
                      <textarea
                        className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[72px]"
                        value={supportReviewText}
                        onChange={(event) => setSupportReviewText(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-[11px]"
                      onClick={() => setIsSupportModalOpen(false)}
                      disabled={isSupportUnlockSubmitting}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-3 text-[11px]"
                      disabled={
                        isSupportUnlockSubmitting ||
                        !supportLikeChecked ||
                        !supportReviewChecked ||
                        !supportReviewText.trim()
                      }
                      onClick={() => {
                        if (!supportLikeChecked || !supportReviewChecked || !supportReviewText.trim()) {
                          return
                        }
                        setIsSupportUnlockSubmitting(true)
                        setHasUnlockedExtraCompanies(true)
                        setIsSupportModalOpen(false)
                        setIsSupportUnlockSubmitting(false)
                      }}
                    >
                      {t('vehicle_details.support_modal.unlock_btn')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {vehicle && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-base md:text-lg font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-[2px] text-[11px] text-muted-foreground">
                        <Icon icon="mdi:map-marker" className="h-3 w-3" />
                        {vehicle.yard_name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-[2px] text-[11px] text-muted-foreground">
                        <Icon icon="mdi:warehouse" className="h-3 w-3" />
                        {formatAuctionSource(vehicle.source) ?? vehicle.source}
                      </span>
                    </div>
                  )}
                  {vehicle && (
                    <div className="flex flex-col items-end gap-0.5 text-xs">
                      {formatMoney(vehicle.calc_price) && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/5 px-2 py-[2px]">
                          <Icon icon="mdi:currency-usd" className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-semibold text-sm">
                            {formatMoney(vehicle.calc_price)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                    {isLeadModalOpen && (
                      <motion.div
                        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 8 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('vehicle_details.request_modal.aria_label')}
                        onClick={() => setIsLeadModalOpen(false)}
                      >
                        <div
                          className="relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                            onClick={() => setIsLeadModalOpen(false)}
                            aria-label={t('vehicle_details.request_modal.close_aria')}
                          >
                            <Icon icon="mdi:close" className="h-4 w-4" />
                          </button>
                          <div className="space-y-3 text-sm">
                            <div>
                              <div className="text-base font-semibold mb-1">{t('vehicle_details.request_modal.title')}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {t('vehicle_details.request_modal.selected_companies', { names: selectedCompanyNames.join(', ') })}
                              </div>
                            </div>
                            {leadError && (
                              <div className="text-[11px] text-destructive">{leadError}</div>
                            )}
                            <form className="space-y-3 mt-2" onSubmit={handleSubmitLead}>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium" htmlFor="lead-name">
                                  {t('common.name')}
                                </label>
                                <input
                                  id="lead-name"
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  value={orderName}
                                  onChange={(event) => setOrderName(event.target.value)}
                                  disabled={isLeadSubmitting}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium" htmlFor="lead-phone">
                                  {t('common.phone')}
                                </label>
                                <input
                                  id="lead-phone"
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  value={orderPhone}
                                  onChange={(event) => setOrderPhone(event.target.value)}
                                  disabled={isLeadSubmitting}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium" htmlFor="lead-comment">
                                  {t('vehicle_details.request_modal.comment_label')}
                                </label>
                                <textarea
                                  id="lead-comment"
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[72px]"
                                  value={orderComment}
                                  onChange={(event) => setOrderComment(event.target.value)}
                                  disabled={isLeadSubmitting}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium" htmlFor="lead-budget-min">
                                    {t('vehicle_details.request_modal.min_budget')}
                                  </label>
                                  <input
                                    id="lead-budget-min"
                                    type="number"
                                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={budgetUsdMin}
                                    onChange={(event) => setBudgetUsdMin(event.target.value)}
                                    disabled={isLeadSubmitting}
                                    min={0}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium" htmlFor="lead-budget-max">
                                    {t('vehicle_details.request_modal.max_budget')}
                                  </label>
                                  <input
                                    id="lead-budget-max"
                                    type="number"
                                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={budgetUsdMax}
                                    onChange={(event) => setBudgetUsdMax(event.target.value)}
                                    disabled={isLeadSubmitting}
                                    min={0}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label
                                    className="text-[11px] font-medium"
                                    htmlFor="lead-desired-duration-days"
                                  >
                                    {t('vehicle_details.request_modal.desired_time')}
                                  </label>
                                  <input
                                    id="lead-desired-duration-days"
                                    type="number"
                                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={desiredDurationDays}
                                    onChange={(event) => setDesiredDurationDays(event.target.value)}
                                    disabled={isLeadSubmitting}
                                    min={0}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label
                                    className="text-[11px] font-medium"
                                    htmlFor="lead-max-duration-days"
                                  >
                                    {t('vehicle_details.request_modal.max_time')}
                                  </label>
                                  <input
                                    id="lead-max-duration-days"
                                    type="number"
                                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={maxAcceptableDurationDays}
                                    onChange={(event) => setMaxAcceptableDurationDays(event.target.value)}
                                    disabled={isLeadSubmitting}
                                    min={0}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[11px] font-medium">{t('vehicle_details.request_modal.damage_tolerance.title')}</div>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name="lead-damage-tolerance"
                                      value="minimal"
                                      checked={damageTolerance === 'minimal'}
                                      onChange={() => setDamageTolerance('minimal')}
                                      disabled={isLeadSubmitting}
                                    />
                                    <span>{t('vehicle_details.request_modal.damage_tolerance.minimal')}</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name="lead-damage-tolerance"
                                      value="moderate"
                                      checked={damageTolerance === 'moderate'}
                                      onChange={() => setDamageTolerance('moderate')}
                                      disabled={isLeadSubmitting}
                                    />
                                    <span>{t('vehicle_details.request_modal.damage_tolerance.average')}</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name="lead-damage-tolerance"
                                      value="any"
                                      checked={damageTolerance === 'any'}
                                      onChange={() => setDamageTolerance('any')}
                                      disabled={isLeadSubmitting}
                                    />
                                    <span>{t('vehicle_details.request_modal.damage_tolerance.any')}</span>
                                  </label>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[11px] font-medium">{t('vehicle_details.request_modal.additional_services.title')}</div>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  {[
                                    { key: 'full_documents', label: t('vehicle_details.request_modal.additional_services.full_documents') },
                                    { key: 'door_delivery', label: t('vehicle_details.request_modal.additional_services.door_delivery') },
                                    { key: 'customs_support', label: t('vehicle_details.request_modal.additional_services.customs_support') },
                                  ].map((item) => {
                                    const checked = serviceExtras.includes(item.key)
                                    return (
                                      <label key={item.key} className="inline-flex items-center gap-1">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(event) => {
                                            if (event.target.checked) {
                                              setServiceExtras((prev) =>
                                                prev.includes(item.key)
                                                  ? prev
                                                  : [...prev, item.key],
                                              )
                                            } else {
                                              setServiceExtras((prev) =>
                                                prev.filter((value) => value !== item.key),
                                              )
                                            }
                                          }}
                                          disabled={isLeadSubmitting}
                                        />
                                        <span>{item.label}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[11px] font-medium">{t('vehicle_details.request_modal.contact_channel.title')}</div>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  {[
                                    { key: 'whatsapp', label: 'WhatsApp' },
                                    { key: 'telegram', label: 'Telegram' },
                                    { key: 'phone', label: t('vehicle_details.request_modal.contact_channel.call') },
                                    { key: 'email', label: 'Email' },
                                  ].map((channel) => (
                                    <label key={channel.key} className="inline-flex items-center gap-1">
                                      <input
                                        type="radio"
                                        name="lead-contact-channel"
                                        value={channel.key}
                                        checked={preferredContactChannel === channel.key}
                                        onChange={() =>
                                          setPreferredContactChannel(
                                            channel.key as 'whatsapp' | 'telegram' | 'phone' | 'email',
                                          )
                                        }
                                        disabled={isLeadSubmitting}
                                      />
                                      <span>{channel.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium" htmlFor="lead-priority">
                                  {t('vehicle_details.request_modal.priority')}
                                </label>
                                <select
                                  id="lead-priority"
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  value={leadPriority}
                                  onChange={(event) => setLeadPriority(event.target.value as 'price')}
                                  disabled={isLeadSubmitting}
                                >
                                  <option value="price">{t('common.price')}</option>
                                </select>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-[11px]"
                                  onClick={() => setIsLeadModalOpen(false)}
                                  disabled={isLeadSubmitting}
                                >
                                  {t('vehicle_details.request_modal.send_btn')}
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="h-8 px-3 text-[11px] flex items-center gap-1"
                                  disabled={isLeadSubmitting}
                                >
                                  <Icon
                                    icon={isLeadSubmitting ? 'mdi:loading' : 'mdi:send-circle'}
                                    className={cn('h-4 w-4', isLeadSubmitting && 'animate-spin')}
                                  />
                                  {t('vehicle_details.request_modal.send_request_btn')}
                                </Button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </CardContent>
            </Card>

            {isInitialLoading && (
              <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                </div>
              </div>
            )}

            {!isInitialLoading && error && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="py-4 flex items-center justify-between gap-3 text-sm">
                  <span className="text-destructive">{error}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={recalculate}
                    className="h-8 px-3 text-xs"
                  >
                    {t('common.retry')}
                  </Button>
                </CardContent>
              </Card>
            )}
            {!isInitialLoading && !error && vehicle && (
                <div className="grid gap-6 md:grid-cols-5 w-full max-w-full">
                  <Card className="md:col-span-2 flex flex-col">
                    <CardContent className="flex-1 flex flex-col gap-4">
                      {photos.length > 0 ? (
                        <div className="space-y-3">
                          <button
                            type="button"
                            className="w-full cursor-zoom-in rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            onClick={() => setIsLightboxOpen(true)}
                            aria-label={t('vehicle_details.gallery.zoom_aria')}
                          >
                            <img
                              src={photos[activePhotoIndex]?.url || photos[0].url}
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className={cn(
                                'w-full max-h-[380px] object-cover rounded-md transform transition-opacity duration-300 ease-out',
                                isImageFading ? 'opacity-0' : 'opacity-100',
                              )}
                            />
                          </button>
                          {photos.length > 1 && (
                            <div className="flex items-center justify-between gap-2 pb-1 pt-1">
                              {totalThumbPages > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full text-[10px]"
                                  onClick={() =>
                                    setThumbPage((prev) => (prev > 0 ? prev - 1 : prev))
                                  }
                                  disabled={clampedThumbPage === 0}
                                  aria-label={t('vehicle_details.gallery.prev_aria')}
                                >
                                  <Icon icon="mdi:chevron-left" className="h-4 w-4" />
                                </Button>
                              )}

                              <div className="flex gap-2">
                                {visibleThumbs.map((photo, index) => {
                                  const globalIndex = thumbStartIndex + index
                                  const isActive = globalIndex === activePhotoIndex

                                  return (
                                    <button
                                      key={photo.id}
                                      type="button"
                                      className={cn(
                                        'flex-shrink-0 w-20 h-16 md:w-24 md:h-20 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                        isActive ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100',
                                      )}
                                      onClick={() => {
                                        if (isActive) return
                                        setActivePhotoIndex(globalIndex)
                                      }}
                                      aria-label={t('vehicle_details.gallery.select_zoom_aria')}
                                    >
                                      <img
                                        src={photo.thumb_url || photo.url}
                                        alt="thumb"
                                        className="w-full h-full object-cover rounded-md overflow-hidden"
                                      />
                                    </button>
                                  )
                                })}
                              </div>

                              {totalThumbPages > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full text-[10px]"
                                  onClick={() =>
                                    setThumbPage((prev) =>
                                      prev < totalThumbPages - 1 ? prev + 1 : prev,
                                    )
                                  }
                                  disabled={clampedThumbPage >= totalThumbPages - 1}
                                  aria-label={t('vehicle_details.gallery.next_aria')}
                                >
                                  <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-muted rounded-md text-xs text-muted-foreground gap-2">
                          <Icon icon="mdi:image-off" className="h-5 w-5" />
                          <span>{t('vehicle_details.gallery.unavailable')}</span>
                        </div>
                      )}

                      <div
                        className="space-y-3 text-[11px] text-muted-foreground pt-2"
                        aria-label={t('vehicle_details.title')}
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.basic_data')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.year} · {formatMileage(vehicle.mileage) || 'N/A'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              VIN
                            </span>
                            <span className="text-xs font-medium text-foreground break-all">
                              {vehicle.vin || '—'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.engine_transmission')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {(vehicle.engine_volume ? `${vehicle.engine_volume}L` : '—')}
                              {vehicle.engine_fuel ? ` · ${vehicle.engine_fuel}` : ''}
                              {vehicle.transmission ? ` · ${vehicle.transmission}` : ''}
                              {vehicle.drive ? ` · ${vehicle.drive}` : ''}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.color_condition')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.color || '—'}
                              {vehicle.status ? ` · ${vehicle.status}` : ''}
                            </span>
                          </div>

                          {!(
                            vehicle.damage_main_damages === 'UNKNOWN' &&
                            vehicle.damage_secondary_damages === 'UNKNOWN'
                          ) && (
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.damages')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.damage_main_damages || '—'}
                                {vehicle.damage_secondary_damages
                                  ? ` · ${vehicle.damage_secondary_damages}`
                                  : ''}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.keys_run_drive')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.has_keys_readable || (vehicle.has_keys ? 'yes' : 'no') || '—'}
                              {vehicle.run_and_drive ? ` · ${vehicle.run_and_drive}` : ''}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.airbags_odometer')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.airbags || '—'}
                              {vehicle.odometer_brand ? ` · ${vehicle.odometer_brand}` : ''}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              {t('vehicle_details.info.cylinders_equipment')}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.cylinders || '—'}
                              {vehicle.equipment ? ` · ${vehicle.equipment}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-border/40" aria-label={t('vehicle_details.info.docs_auction')}>
                          <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                            {t('vehicle_details.info.docs_auction')}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.yard_location')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.yard_name || '—'}
                                {vehicle.city || vehicle.sale_title_state
                                  ? ` · ${vehicle.city || ''}${
                                      vehicle.sale_title_state ? `, ${vehicle.sale_title_state}` : ''
                                    }`
                                  : ''}
                              </span>
                            </div>
                            {/* ID / Lot number intentionally hidden per requirements */}

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.source_lot_salvage')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.source_lot_id || '—'}
                                {vehicle.salvage_id ? ` · ${vehicle.salvage_id}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.market_repair_value')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatMoney(vehicle.retail_value) || '—'}
                                {vehicle.repair_cost
                                  ? ` · $${Number(vehicle.repair_cost).toLocaleString()} USD`
                                  : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.calculated_price')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatMoney(vehicle.calc_price) || '—'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.final_bid_buy_now')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.final_bid
                                  ? `$${Number(vehicle.final_bid).toLocaleString()} USD`
                                  : '—'}
                                {Number(vehicle.buy_it_now_price) > 0
                                  ? ` · ${t('vehicle_details.info.buy_now')}: $${Number(vehicle.buy_it_now_price).toLocaleString()} USD`
                                  : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.seller')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.seller || '—'}
                                {vehicle.seller_type ? ` · ${vehicle.seller_type}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.title_doc')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.sale_title_type || vehicle.title || '—'}
                                {vehicle.document ? ` · ${vehicle.document}` : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.sale_date')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatDateTime(vehicle.sold_at_date || vehicle.sold_at, vehicle.sold_at_time) || '—'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                {t('vehicle_details.info.created_updated')}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatDateTime(vehicle.created_at, null) || '—'}
                                {vehicle.updated_at ? ` · ${formatDateTime(vehicle.updated_at, null)}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-border/40" aria-label={t('vehicle_details.info.api_fields')}>
                          <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                            {t('vehicle_details.info.api_fields')}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">{t('vehicle_details.info.vehicle_type_key')}</span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.vehicle_type || '—'}
                                {vehicle.vehicle_type_key ? ` · ${vehicle.vehicle_type_key}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">{t('vehicle_details.info.state_city_slug')}</span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.state || '—'}
                                {vehicle.city_slug ? ` · ${vehicle.city_slug}` : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">{t('vehicle_details.info.is_new')}</span>
                              <span className="text-xs font-medium text-foreground">{vehicle.is_new ?? '—'}</span>
                            </div>
                          </div>
                        </div>

                        {vehicle.iaai_360_view && (
                          <div className="pt-1 border-t border-border/40" aria-label={t('vehicle_details.info.iaai_360_view')}>
                            <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                              {t('vehicle_details.info.iaai_360_view')}
                            </div>
                            <div className="rounded-md border overflow-hidden">
                              <iframe
                                src={vehicle.iaai_360_view}
                                title="IAAI 360 View"
                                className="w-full h-[360px] md:h-[420px] lg:h-[480px]"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>

                  <Card className="flex flex-col md:col-span-3" ref={offersRef}>
                    <CardHeader>
                      <CardTitle className="text-base flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span>{t('vehicle_details.offers.title')}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs flex items-center gap-1"
                              onClick={handleRecalculate}
                              disabled={isLoading}
                              aria-busy={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Icon icon="mdi:loading" className="h-3 w-3 animate-spin" />
                                  {t('vehicle_details.offers.recalculating')}
                                </>
                              ) : (
                                <>
                                  <Icon icon="mdi:refresh" className="h-4 w-4" />
                                  {t('vehicle_details.offers.recalculate')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {t('vehicle_details.offers.compare_text')}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {t('vehicle_details.offers.total_price_disclaimer')}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent
                      className={cn(
                        'flex-1 text-sm space-y-4',
                        (isLoading || isRecalculating) && 'animate-pulse',
                      )}
                    >
                      {isLoading && (
                        <div className="space-y-2" aria-busy="true">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-14 w-full" />
                          <Skeleton className="h-14 w-full" />
                        </div>
                      )}

                      {!isLoading && !sortedQuotes.length && (
                        <div className="space-y-3 text-xs">
                          <p className="text-muted-foreground">
                            {t('vehicle_details.offers.no_offers')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs flex items-center gap-1"
                              onClick={() => navigate('/catalog')}
                            >
                              <Icon icon="mdi:view-grid" className="h-4 w-4" />
                              {t('vehicle_details.offers.back_to_catalog')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-xs flex items-center gap-1"
                              onClick={() => navigate('/catalog')}
                            >
                              <Icon icon="mdi:magnify" className="h-4 w-4" />
                              {t('vehicle_details.offers.find_other')}
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isLoading && sortedQuotes.length > 0 && (
                        <div className="space-y-4">
                          {bestQuote && (
                            <div
                              className={cn(
                                'p-3 rounded-md border bg-muted/40 flex items-center justify-between gap-3',
                                'border-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.7)] animate-pulse',
                              )}
                            >
                              <div>
                                <div className="text-[11px] text-muted-foreground mb-1">
                                  {t('vehicle_details.offers.best_shipping')}
                                </div>
                                <div className="text-sm font-semibold">
                                  {formatMoney(bestQuote.breakdown?.shipping_total ?? null) ?? '—'}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {t('vehicle_details.offers.shipping_desc')}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-foreground">
                                  {bestQuote.company_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {t('vehicle_details.offers.full_service_desc')}
                                </div>
                                {bestQuote.delivery_time_days != null && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {t('vehicle_details.offers.delivery_time', { days: bestQuote.delivery_time_days })}
                                  </div>
                                )}
                              </div>
                              <Icon icon="mdi:star" className="h-6 w-6 text-amber-400" />
                            </div>
                          )}

                          {savingsAmount != null && (
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                              <Icon icon="mdi:piggy-bank" className="h-4 w-4" />
                              <span>
                                {t('vehicle_details.offers.approx_savings')}{' '}
                                <span className="font-semibold">
                                  ${savingsAmount.toLocaleString()} USD
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground">
                              {t('vehicle_details.offers.company_filter')}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant={showOnlyPremium && !showOnlyStandard ? 'default' : 'outline'}
                                className="h-7 px-2 text-[10px] flex items-center gap-1"
                                onClick={() => {
                                  setShowOnlyPremium((prev) => !prev)
                                  setShowOnlyStandard(false)
                                }}
                                aria-pressed={showOnlyPremium && !showOnlyStandard}
                              >
                                <Icon icon="mdi:crown" className="h-3 w-3" />
                                VIP
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant={showOnlyStandard ? 'default' : 'outline'}
                                className="h-7 px-2 text-[10px] flex items-center gap-1"
                                onClick={() => {
                                  setShowOnlyStandard((prev) => !prev)
                                  setShowOnlyPremium(false)
                                }}
                                aria-pressed={showOnlyStandard}
                              >
                                <Icon icon="mdi:account" className="h-3 w-3" />
                                Regular
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant={onlyHighRating ? 'default' : 'outline'}
                                className="h-7 px-2 text-[10px] flex items-center gap-1"
                                onClick={() => setOnlyHighRating((prev) => !prev)}
                                aria-pressed={onlyHighRating}
                              >
                                <Icon icon="mdi:star" className="h-3 w-3" />
                                ≥ 4.5
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant={onlyFastDelivery ? 'default' : 'outline'}
                                className="h-7 px-2 text-[10px] flex items-center gap-1"
                                onClick={() => setOnlyFastDelivery((prev) => !prev)}
                                aria-pressed={onlyFastDelivery}
                              >
                                <Icon icon="mdi:truck-fast" className="h-3 w-3" />
                                {t('vehicle_details.offers.fast_delivery')}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3" role="list" aria-label={t('vehicle_details.offers.list_aria')}>
                            <AnimatePresence initial={false}>
                              {premiumQuotes.length > 0 && !showOnlyStandard && (
                                <>
                                  <div className="text-[11px] font-medium text-foreground flex items-center gap-1">
                                    <Icon icon="mdi:crown" className="h-3 w-3 text-amber-400" />
                                    <span>{t('vehicle_details.offers.premium_vip')}</span>
                                  </div>
                                  {premiumQuotes.map(({ quote, vipLabel, index }) => {
                                    const companyMeta = mockCompanies.find(
                                      (company: any) => company.name === quote.company_name,
                                    )

                                    const passesRating =
                                      !onlyHighRating || !companyMeta || companyMeta.rating >= 4.5

                                    const isDiscounted =
                                      averageTotalPrice != null && quote.total_price < averageTotalPrice

                                    const includesDocuments =
                                      (quote.breakdown.service_fee ?? 0) > 0 ||
                                      (quote.breakdown.broker_fee ?? 0) > 0
                                    const includesTransport = (quote.breakdown.shipping_total ?? 0) > 0
                                    const includesCustoms = (quote.breakdown.customs_fee ?? 0) > 0

                                    const passesFastDelivery =
                                      !onlyFastDelivery ||
                                      quote.delivery_time_days == null ||
                                      quote.delivery_time_days <= 30

                                    const isActiveBreakdown =
                                      activeBreakdownQuote?.company_name === quote.company_name
                                    const isSelected =
                                      selectedQuote?.company_name === quote.company_name
                                    const isInLeadSelection = selectedCompanyNames.includes(quote.company_name)

                                    if (!passesRating || !passesFastDelivery) {
                                      return null
                                    }

                                    return (
                                      <motion.div
                                        key={`${quote.company_id ?? quote.company_name}-${quote.total_price}-${index}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                      >
                                        <div
                                          className={cn(
                                            'relative flex flex-col md:flex-row md:items-start md:justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background max-w-full',
                                            vipLabel &&
                                              (vipLabel.includes('Diamond')
                                                ? 'border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.5)]'
                                                : vipLabel.includes('Gold')
                                                  ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
                                                  : 'border-slate-300/70'),
                                            isSelected &&
                                              'border-primary shadow-[0_0_0_1px_rgba(16,185,129,0.6)]',
                                          )}
                                          role="listitem"
                                          onClick={() => handleOpenCompanyPage(quote)}
                                          tabIndex={0}
                                        >
                                          <div className="space-y-1 min-w-0">
                                            <div className="text-sm font-semibold mb-0.5">{quote.company_name}</div>
                                            {companyMeta && (
                                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <Icon
                                                    key={star}
                                                    icon={
                                                      star <= Math.round(companyMeta.rating)
                                                        ? 'mdi:star'
                                                        : 'mdi:star-outline'
                                                    }
                                                    className={
                                                      star <= Math.round(companyMeta.rating)
                                                        ? 'h-3 w-3 text-amber-400'
                                                        : 'h-3 w-3 text-muted-foreground/40'
                                                    }
                                                  />
                                                ))}
                                                <span>{companyMeta.rating.toFixed(1)}</span>
                                                <span>({companyMeta.reviewCount} {t('common.reviews')})</span>
                                              </div>
                                            )}
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span>{t('vehicle_details.offers.shipping_desc')}</span>
                                                {isDiscounted && (
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                        <Icon icon="mdi:tag" className="h-3 w-3" />
                                                        {t('vehicle_details.offers.discount')}
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                      <span>
                                                        {t('vehicle_details.offers.approx_savings')}:
                                                        {averageTotalPrice != null
                                                          ? ` $${(averageTotalPrice - quote.total_price).toLocaleString()} USD`
                                                          : ' ' + t('vehicle_details.offers.individual_calc')}
                                                        . {t('vehicle_details.offers.discount_disclaimer')}
                                                      </span>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                )}
                                              </div>
                                              <div
                                                className={cn(
                                                  'text-sm font-bold',
                                                  getShippingPriceColorClass(
                                                    quote,
                                                    bestQuote,
                                                    isDiscounted,
                                                  ),
                                                )}
                                              >
                                                {formatMoney(quote.breakdown?.shipping_total ?? null) ?? '—'}
                                              </div>
                                            </div>
                                            {quote.delivery_time_days != null && (
                                              <div className="text-[11px] text-muted-foreground">
                                                {t('vehicle_details.offers.import_completed_in', { days: quote.delivery_time_days })}
                                              </div>
                                            )}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                    <Icon icon="mdi:shield-check" className="h-3 w-3" />
                                                    {t('vehicle_details.offers.trusted_partner')}
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                  <span>
                                                    {t('vehicle_details.offers.trusted_partner_desc')}
                                                  </span>
                                                </TooltipContent>
                                              </Tooltip>
                                              {(vipLabel?.includes('Diamond') || vipLabel?.includes('Gold')) && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                      <Icon icon="mdi:lock-check" className="h-3 w-3" />
                                                      {t('vehicle_details.offers.secure_payment')}
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top">
                                                    <span>
                                                      {t('vehicle_details.offers.secure_payment_desc')}
                                                    </span>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                              {vipLabel?.includes('Diamond') && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                      <Icon icon="mdi:file-check" className="h-3 w-3" />
                                                      {t('vehicle_details.offers.documents_full')}
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top">
                                                    <span>
                                                      {t('vehicle_details.offers.documents_full_desc')}
                                                    </span>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-muted-foreground">
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesDocuments ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesDocuments ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.documents')}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.transport')}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.customs')}</span>
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end gap-2 md:self-start">
                                            {vipLabel && <VipBadge label={vipLabel} />}
                                            <div className="flex flex-col items-end gap-1">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                  'h-7 px-2 text-[10px] flex items-center gap-1',
                                                  isActiveBreakdown && 'border-primary text-primary',
                                                )}
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  setActiveBreakdownQuote(quote)
                                                }}
                                                aria-pressed={isActiveBreakdown}
                                                aria-label={t('vehicle_details.offers.select_fee_aria')}
                                              >
                                                <Icon icon="mdi:receipt-text" className="h-3 w-3" />
                                                {t('vehicle_details.offers.individual_calc')}
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant={isInLeadSelection ? 'default' : 'outline'}
                                                className="h-7 px-2 text-[10px] flex items-center gap-1 transition-all duration-200"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  toggleSelectedCompany(quote.company_name)
                                                }}
                                                aria-pressed={isInLeadSelection}
                                                aria-label={t('vehicle_details.offers.select_offer_aria')}
                                              >
                                                <Icon
                                                  icon={
                                                    isInLeadSelection
                                                      ? 'mdi:checkbox-marked-circle-outline'
                                                      : 'mdi:checkbox-blank-circle-outline'
                                                  }
                                                  className="h-3 w-3"
                                                />
                                                <span>
                                                  {isInLeadSelection
                                                    ? selectedCompanyNames.length === 1
                                                      ? t('vehicle_details.offers.selected')
                                                      : t('vehicle_details.offers.selected_common')
                                                    : t('vehicle_details.offers.select')}
                                                </span>
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )
                                  })}
                                </>
                              )}

                              {!showOnlyPremium && standardQuotes.length > 0 && (
                                <>
                                  <div className="pt-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                    <Icon icon="mdi:cash-multiple" className="h-3 w-3 text-emerald-500" />
                                    <span>{t('vehicle_details.offers.standard')}</span>
                                  </div>
                                  {standardQuotes.map(({ quote, vipLabel, index }) => {
                                    const companyMeta = mockCompanies.find(
                                      (company: any) => company.name === quote.company_name,
                                    )

                                    const passesRating =
                                      !onlyHighRating || !companyMeta || companyMeta.rating >= 4.5

                                    const isDiscounted =
                                      averageTotalPrice != null && quote.total_price < averageTotalPrice

                                    const includesDocuments =
                                      (quote.breakdown.service_fee ?? 0) > 0 ||
                                      (quote.breakdown.broker_fee ?? 0) > 0
                                    const includesTransport = (quote.breakdown.shipping_total ?? 0) > 0
                                    const includesCustoms = (quote.breakdown.customs_fee ?? 0) > 0

                                    if (!passesRating) {
                                      return null
                                    }

                                    const isActiveBreakdown =
                                      activeBreakdownQuote?.company_name === quote.company_name
                                    const isSelected =
                                      selectedQuote?.company_name === quote.company_name
                                    const isInLeadSelection = selectedCompanyNames.includes(quote.company_name)

                                    return (
                                      <motion.div
                                        key={`${quote.company_id ?? quote.company_name}-${quote.total_price}-${index}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                      >
                                        <div
                                          className={cn(
                                            'relative flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                            vipLabel &&
                                              (vipLabel.includes('Diamond')
                                                ? 'border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.5)]'
                                                : vipLabel.includes('Gold')
                                                  ? 'border-amber-400/70 shadow-[0_0_0_1px_rgβα(251,191,36,0.5)]'
                                                  : 'border-slate-300/70'),
                                            isSelected &&
                                              'border-primary shadow-[0_0_0_1px_rgba(16,185,129,0.6)]',
                                          )}
                                          role="listitem"
                                        >
                                          <div className="space-y-1">
                                            <div className="text-sm font-semibold mb-0.5">{quote.company_name}</div>
                                            {companyMeta && (
                                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <Icon
                                                    key={star}
                                                    icon={
                                                      star <= Math.round(companyMeta.rating)
                                                        ? 'mdi:star'
                                                        : 'mdi:star-outline'
                                                    }
                                                    className={
                                                      star <= Math.round(companyMeta.rating)
                                                        ? 'h-3 w-3 text-amber-400'
                                                        : 'h-3 w-3 text-muted-foreground/40'
                                                    }
                                                  />
                                                ))}
                                                <span>{companyMeta.rating.toFixed(1)}</span>
                                                <span>({companyMeta.reviewCount} {t('common.reviews')})</span>
                                              </div>
                                            )}
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span>{t('vehicle_details.offers.shipping_desc')}</span>
                                                {isDiscounted && (
                                                  <span className="inline-flex itemsორცნერ gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium">
                                                    <Icon icon="mdi:tag" className="h-3 w-3" />
                                                    {t('vehicle_details.offers.discount')}
                                                  </span>
                                                )}
                                              </div>
                                              <div
                                                className={cn(
                                                  'text-sm font-bold',
                                                  getShippingPriceColorClass(
                                                    quote,
                                                    bestQuote,
                                                    isDiscounted,
                                                  ),
                                                )}
                                              >
                                                {formatMoney(quote.breakdown?.shipping_total ?? null) ?? '—'}
                                              </div>
                                            </div>
                                            {quote.delivery_time_days != null && (
                                              <div className="text-[11px] text-muted-foreground">
                                                {t('vehicle_details.offers.import_completed_in', { days: quote.delivery_time_days })}
                                              </div>
                                            )}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium">
                                                <Icon icon="mdi:shield-check" className="h-3 w-3" />
                                                {t('vehicle_details.offers.trusted_partner')}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-muted-foreground">
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesDocuments ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesDocuments ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.documents')}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.transport')}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>{t('vehicle_details.offers.customs')}</span>
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end gap-2">
                                            {vipLabel && <VipBadge label={vipLabel} />}
                                            <div className="flex flex-col items-end gap-1">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                  'h-7 px-2 text-[10px] flex items-center gap-1',
                                                  isActiveBreakdown && 'border-primary text-primary',
                                                )}
                                                onClick={() => setActiveBreakdownQuote(quote)}
                                                aria-pressed={isActiveBreakdown}
                                                aria-label={t('vehicle_details.offers.select_fee_aria')}
                                              >
                                                <Icon icon="mdi:receipt-text" className="h-3 w-3" />
                                                {t('vehicle_details.offers.individual_calc')}
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant={isInLeadSelection ? 'default' : 'outline'}
                                                className="h-7 px-2 text-[10px] flex items-center gap-1"
                                                onClick={() => toggleSelectedCompany(quote.company_name)}
                                                aria-pressed={isInLeadSelection}
                                                aria-label={t('vehicle_details.offers.add_to_common_aria')}
                                              >
                                                <Icon
                                                  icon={
                                                    isInLeadSelection
                                                      ? 'mdi:checkbox-marked-circle-outline'
                                                      : 'mdi:checkbox-blank-circle-outline'
                                                  }
                                                  className="h-3 w-3"
                                                />
                                                <span>
                                                  {isInLeadSelection
                                                    ? selectedCompanyNames.length === 1
                                                      ? t('vehicle_details.offers.selected')
                                                      : t('vehicle_details.offers.selected_common')
                                                    : t('vehicle_details.offers.select')}
                                                </span>
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )
                                  })}
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {quotesTotalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t mt-4">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={handlePrevQuotesPage}
                                disabled={quotesPage <= 1 || isLoading}
                              >
                                <Icon icon="mdi:chevron-left" className="h-4 w-4 me-1" />
                                {t('common.prev')}
                              </Button>
                              <span className="text-[11px] text-muted-foreground">
                                {t('common.page')} {quotesPage} / {quotesTotalPages}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={handleNextQuotesPage}
                                disabled={quotesPage >= quotesTotalPages || isLoading}
                              >
                                {t('common.next')}
                                <Icon icon="mdi:chevron-right" className="h-4 w-4 ms-1" />
                              </Button>
                            </div>
                          )}

                          {mockRecentCases.length > 0 && (
                            <div className="mt-3 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs mt-4">
                              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                                <Icon icon="mdi:clock-check" className="h-3 w-3" />
                                <span>{t('vehicle_details.offers.recent_imports')}</span>
                              </div>
                              <ul className="space-y-[2px]">
                                {mockRecentCases.slice(0, 3).map((item: { id: string; make: string; model: string; from: string; to: string; days: number }) => (
                                  <li key={item.id} className="flex items-start gap-1">
                                    <span className="mt-[2px] text-[9px] text-muted-foreground">•</span>
                                    <span>
                                      <span className="font-medium">{item.make} {item.model}</span>
                                      {" — "}
                                      <span className="font-medium">{item.from}→{item.to}</span>
                                      {", " + t('vehicle_details.offers.import_completed_in', { days: item.days })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-end pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-[11px]"
                              onClick={() => navigate('/auction-listings')}
                            >
                              <Icon icon="mdi:car-search" className="h-4 w-4" />
                              {t('vehicle_details.offers.see_other_auctions')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              {!isInitialLoading && !error && !vehicle && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {t('vehicle_details.offers.not_found_msg')}
                </div>
              )}
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-xs mt-4">
            <div>
              <div className="font-medium text-sm">{t('vehicle_details.offers.continue_working')}</div>
              <div className="text-muted-foreground mt-1">
                {t('vehicle_details.offers.compare_desc')}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={() => navigate('/catalog')}
                aria-label={t('vehicle_details.offers.back_to_catalog_aria')}
              >
                <Icon icon="mdi:view-grid" className="h-4 w-4" />
                {t('vehicle_details.offers.back_to_catalog')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={handleScrollToOffers}
                aria-label={t('vehicle_details.offers.go_to_offers_aria')}
              >
                <Icon icon="mdi:car-info" className="h-4 w-4" />
                {t('vehicle_details.offers.see_offers')}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer footerLinks={footerLinks} />

      <AnimatePresence>
        {sortedQuotes.length > 0 && selectedCompanyNames.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 pointer-events-none"
          >
            <div className="shadow-lg rounded-full bg-background/95 border border-border/60 px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={handleSendClick}
                aria-label={t('vehicle_details.offers.send_request_aria')}
                disabled={selectedCompanyNames.length === 0 || isLeadSubmitting}
              >
                <Icon icon="mdi:arrow-right-circle" className="h-4 w-4" />
                {t('vehicle_details.request_modal.send_btn')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOrderPopupOpen && selectedQuote && (
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 transition-opacity duration-200 ease-out',
            isOrderPopupEntering ? 'opacity-100' : 'opacity-0',
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t('vehicle_details.checkout.aria_label', { company: selectedQuote.company_name })}
          onClick={closeOrderPopup}
        >
          <div
            className={cn(
              'relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg transform transition-all duration-200 ease-out',
              isOrderPopupEntering
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-95',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
              onClick={closeOrderPopup}
              aria-label={t('vehicle_details.checkout.close_aria')}
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-base font-semibold mb-1">{t('vehicle_details.checkout.title')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('vehicle_details.checkout.company_label', { company: selectedQuote.company_name })}
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div>
                  {t('vehicle_details.checkout.total_import_price')}: <span className="font-semibold">${selectedQuote.total_price.toLocaleString()} USD</span>
                </div>
                {selectedQuote.delivery_time_days != null && (
                  <div>
                    {t('vehicle_details.checkout.estimated_delivery', { days: selectedQuote.delivery_time_days })}
                  </div>
                )}
              </div>
              <form className="space-y-3 mt-2" onSubmit={handleSubmitOrder}>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium" htmlFor="order-name">
                    {t('vehicle_details.checkout.name_label')}
                  </label>
                  <input
                    id="order-name"
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={orderName}
                    onChange={(event) => setOrderName(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium" htmlFor="order-phone">
                    {t('vehicle_details.checkout.phone_label')}
                  </label>
                  <input
                    id="order-phone"
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={orderPhone}
                    onChange={(event) => setOrderPhone(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium" htmlFor="order-comment">
                    {t('vehicle_details.checkout.comment_label')}
                  </label>
                  <textarea
                    id="order-comment"
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[72px]"
                    value={orderComment}
                    onChange={(event) => setOrderComment(event.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[11px]"
                    onClick={() => setIsOrderPopupOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 text-[11px]"
                  >
                    {t('vehicle_details.checkout.send_application')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && selectedQuote && (
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 transition-opacity duration-200 ease-out',
            isSuccessEntering ? 'opacity-100' : 'opacity-0',
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t('vehicle_details.checkout.received_aria', { company: selectedQuote.company_name })}
          onClick={closeSuccessModal}
        >
          <div
            className={cn(
              'relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg transform transition-all duration-200 ease-out',
              isSuccessEntering
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-95',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
              onClick={closeSuccessModal}
              aria-label={t('vehicle_details.checkout.close_confirmation_aria')}
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-base font-semibold mb-1">{t('vehicle_details.checkout.received_title')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('vehicle_details.checkout.company_label', { company: selectedQuote.company_name })}
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div>
                  {t('vehicle_details.checkout.total_import_price')}:{' '}
                  <span className="font-semibold">
                    ${selectedQuote.total_price.toLocaleString()} USD
                  </span>
                </div>
                {selectedQuote.delivery_time_days != null && (
                  <div>{t('vehicle_details.checkout.estimated_delivery', { days: selectedQuote.delivery_time_days })}</div>
                )}
                <div className="mt-1">
                  {t('vehicle_details.checkout.received_desc')}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-[11px] flex items-center gap-1"
                  onClick={closeSuccessModal}
                >
                  <Icon icon="mdi:phone" className="h-4 w-4" />
                  {t('vehicle_details.checkout.contact_importer')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-[11px] flex items-center gap-1"
                  onClick={() => {
                    closeSuccessModal()
                    navigate('/catalog')
                  }}
                >
                  <Icon icon="mdi:open-in-new" className="h-4 w-4" />
                  {t('vehicle_details.checkout.go_to_company')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBreakdownQuote && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4 transition-opacity duration-200 ease-out',
            isBreakdownEntering ? 'opacity-100' : 'opacity-0',
          )}
          onClick={closeBreakdownPopup}
          role="dialog"
          aria-modal="true"
          aria-label={t('vehicle_details.checkout.detailed_price_aria', { company: activeBreakdownQuote.company_name })}
        >
          <div
            className={cn(
              'relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg transform transition-all duration-200 ease-out',
              isBreakdownEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
              onClick={closeBreakdownPopup}
              aria-label={t('vehicle_details.checkout.close_price_check_aria')}
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <QuoteBreakdownReceipt
              breakdown={activeBreakdownQuote.breakdown}
              companyName={activeBreakdownQuote.company_name}
            />
          </div>
        </div>
      )}

      {isLightboxOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('vehicle_details.checkout.fullscreen_photo_aria')}
        >
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
              aria-label={t('vehicle_details.checkout.close')}
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <img
              src={photos[activePhotoIndex]?.url || photos[0].url}
              alt={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
              className="max-w-full max-h-[80vh] object-contain rounded-md shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleDetailsPage
