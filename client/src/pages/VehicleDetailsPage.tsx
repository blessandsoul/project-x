import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/Header/index.tsx'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies, mockFooterLinks, mockNavigationItems, mockRecentCases } from '@/mocks/_mockData'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useVehicleDetails } from '@/hooks/useVehicleDetails'
import type { VehicleQuote } from '@/types/vehicles'
import { VipBadge } from '@/components/company/VipBadge'
import QuoteBreakdownReceipt from '@/components/vehicle/QuoteBreakdownReceipt'
import { cn } from '@/lib/utils'

type QuoteWithVipMeta = { quote: VehicleQuote; index: number; vipLabel: string | null }

const VehicleDetailsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id: string }>()
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
  const [showOnlyPremium, setShowOnlyPremium] = useState(false)
  const [showOnlyStandard, setShowOnlyStandard] = useState(false)
  const [onlyHighRating, setOnlyHighRating] = useState(false)
  const [onlyFastDelivery, setOnlyFastDelivery] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const vehicleId = useMemo(() => {
    if (!params.id) return null
    const parsed = Number(params.id)
    return Number.isFinite(parsed) ? parsed : null
  }, [params.id])

  const { vehicle, photos, quotes, distanceMiles, isLoading, error, recalculate } =
    useVehicleDetails(vehicleId)

  const isInitialLoading = isLoading && !vehicle

  const THUMBS_PER_PAGE = 3

  const totalThumbPages = useMemo(() => {
    if (photos.length <= 1) return 0
    return Math.ceil(photos.length / THUMBS_PER_PAGE)
  }, [photos.length])

  const clampedThumbPage = totalThumbPages > 0 ? Math.min(thumbPage, totalThumbPages - 1) : 0

  const thumbStartIndex = clampedThumbPage * THUMBS_PER_PAGE
  const visibleThumbs = photos.slice(thumbStartIndex, thumbStartIndex + THUMBS_PER_PAGE)

  useEffect(() => {
    setActivePhotoIndex(0)
    setThumbPage(0)
  }, [vehicleId, photos.length])

  useEffect(() => {
    if (!photos.length) return
    setIsImageFading(true)
    const timeout = window.setTimeout(() => {
      setIsImageFading(false)
    }, 200)
    return () => {
      window.clearTimeout(timeout)
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

    setIsBreakdownEntering(false)

    breakdownCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveBreakdownQuote(null)
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

    setIsBreakdownEntering(false)
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
    if (index === 0) return 'Diamond VIP'
    if (index === 1) return 'Gold VIP'
    if (index === 2) return 'Silver VIP'
    return null
  }

  const premiumQuotes: QuoteWithVipMeta[] = []
  const standardQuotes: QuoteWithVipMeta[] = []

  sortedQuotes.forEach((quote, index) => {
    const vipLabel = getVipLabelForIndex(index)
    const target = vipLabel ? premiumQuotes : standardQuotes
    target.push({ quote, index, vipLabel })
  })

  const openOrderPopupForQuote = (quote: VehicleQuote) => {
    setSelectedQuote(quote)
    setIsOrderPopupOpen(true)
  }

  const handleSelectQuote = (quote: VehicleQuote) => {
    if (activeBreakdownQuote) {
      closeBreakdownPopup()
      window.setTimeout(() => {
        openOrderPopupForQuote(quote)
      }, 220)
      return
    }

    openOrderPopupForQuote(quote)
  }

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
      setIsSuccessEntering(false)
      return
    }

    setIsSuccessEntering(false)
    const frameId = window.requestAnimationFrame(() => {
      setIsSuccessEntering(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isSuccessModalOpen])

  useEffect(() => {
    if (!isOrderPopupOpen) {
      setIsOrderPopupEntering(false)
      return
    }

    setIsOrderPopupEntering(false)
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

  const formatMilesToKilometers = (value: number | null | undefined): string | null => {
    if (value == null) return null

    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return null

    const kilometers = numeric * 1.60934
    const rounded = Math.round(kilometers)

    return `${rounded.toLocaleString()} km`
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
    const companyMeta = mockCompanies.find((company) => company.name === quote.company_name)

    if (companyMeta && 'slug' in companyMeta && companyMeta.slug) {
      navigate(`/companies/${String((companyMeta as any).slug)}`)
      return
    }

    navigate(`/companies?name=${encodeURIComponent(quote.company_name)}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />
      <main className="flex-1" role="main" aria-label="ავტომობილის დეტალები">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-3">
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

              {isInitialLoading && (
                <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-72 w-full" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      თავიდან ცდა
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!isInitialLoading && !error && vehicle && (
                <div className="grid gap-6 md:grid-cols-5">
                  <Card className="md:col-span-2 flex flex-col">
                    <CardContent className="flex-1 flex flex-col gap-4">
                      {photos.length > 0 ? (
                        <div className="space-y-3">
                          <button
                            type="button"
                            className="w-full cursor-zoom-in rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            onClick={() => setIsLightboxOpen(true)}
                            aria-label="გაადიდე მთავარი ფოტო სრულ ეკრანზე"
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
                                  aria-label="წინა ფოტოები"
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
                                      aria-label="აირჩიე ეს ფოტო გასადიდებლად"
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
                                  aria-label="შემდეგი ფოტოები"
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
                          <span>ფოტოები მიუწვდომელია</span>
                        </div>
                      )}

                      <div
                        className="space-y-3 text-[11px] text-muted-foreground pt-2"
                        aria-label="ავტომობილის დეტალური მონაცემები"
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              ძირითადი მონაცემები
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
                              ძრავი / ტრანსმისია
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
                              ფერი / მდგომარეობა
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
                                დაზიანებები
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
                              გასაღებები / Run & Drive
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.has_keys_readable || (vehicle.has_keys ? 'yes' : 'no') || '—'}
                              {vehicle.run_and_drive ? ` · ${vehicle.run_and_drive}` : ''}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              AIRBAGS / ODOMETER
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.airbags || '—'}
                              {vehicle.odometer_brand ? ` · ${vehicle.odometer_brand}` : ''}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                              ცილინდრები / აღჭურვილობა
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {vehicle.cylinders || '—'}
                              {vehicle.equipment ? ` · ${vehicle.equipment}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-border/40" aria-label="დოკუმენტები და აუქციონის მონაცემები">
                          <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                            დოკუმენტები და აუქციონი
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                აუქციონის ეზო / მდებარეობა
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
                            {/* ID / ლოტis ნომერი intentionally hidden per requirements */}

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                SOURCE LOT ID / SALVAGE ID
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.source_lot_id || '—'}
                                {vehicle.salvage_id ? ` · ${vehicle.salvage_id}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                საბაზრო / შეკეთების ღირებულება
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
                                გამოთვლილი ფასი
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatMoney(vehicle.calc_price) || '—'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                FINAL BID / BUY IT NOW
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.final_bid
                                  ? `$${Number(vehicle.final_bid).toLocaleString()} USD`
                                  : '—'}
                                {Number(vehicle.buy_it_now_price) > 0
                                  ? ` · BUY NOW: $${Number(vehicle.buy_it_now_price).toLocaleString()} USD`
                                  : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                გამყიდველი
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.seller || '—'}
                                {vehicle.seller_type ? ` · ${vehicle.seller_type}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                TITLE / დოკუმენტი
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.sale_title_type || vehicle.title || '—'}
                                {vehicle.document ? ` · ${vehicle.document}` : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                გაყიდვის თარიღი
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatDateTime(vehicle.sold_at_date || vehicle.sold_at, vehicle.sold_at_time) || '—'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                                შექმნა / განახლება
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {formatDateTime(vehicle.created_at, null) || '—'}
                                {vehicle.updated_at ? ` · ${formatDateTime(vehicle.updated_at, null)}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-border/40" aria-label="დამატებითი API ველები">
                          <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                            დამატებითი API ველები (დამხმარე ინფორმაცია)
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">VEHICLE TYPE / KEY</span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.vehicle_type || '—'}
                                {vehicle.vehicle_type_key ? ` · ${vehicle.vehicle_type_key}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">STATE / CITY SLUG</span>
                              <span className="text-xs font-medium text-foreground">
                                {vehicle.state || '—'}
                                {vehicle.city_slug ? ` · ${vehicle.city_slug}` : ''}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">IS NEW</span>
                              <span className="text-xs font-medium text-foreground">{vehicle.is_new ?? '—'}</span>
                            </div>
                          </div>
                        </div>

                        {vehicle.iaai_360_view && (
                          <div className="pt-1 border-t border-border/40" aria-label="IAAI 360 VIEW">
                            <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground/90 uppercase">
                              IAAI 360 VIEW
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
                          <span>კომპანიების შეთავაზებები ამ ავტომობილზე</span>
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
                                  გადათვლა...
                                </>
                              ) : (
                                <>
                                  <Icon icon="mdi:refresh" className="h-4 w-4" />
                                  გადათვლა
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          შეადარე იმპორტის სრული ფასი და მიწოდების დრო სხვადასხვა სანდო კომპანიისგან აშშ-დან საქართველოში.
                        </span>
                        {distanceMiles != null && (
                          <span className="text-[11px] text-muted-foreground">
                            დისტანცია ფოთამდე: {formatMilesToKilometers(distanceMiles) ?? `${distanceMiles.toLocaleString()} mi`}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          სრული ფასი მოიცავს ფასი მანქანის, ტრანსპორტირებას, მომსახურებისა და საბროკერო საფასურს, საბაჟო და სხვა გადასახადები წარმოდგენილია დაახლოებით.
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
                            ამ ეტაპზე ავტომობილის იმპორტის შეთავაზებები არ არის ნაპოვნი. სცადეთ გადათვლა ან მოგვიანებით დაბრუნება, ან მოიძიეთ სხვა ავტომობილი იმპორტისთვის.
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
                              კატალოგში დაბრუნება
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-xs flex items-center gap-1"
                              onClick={() => navigate('/catalog')}
                            >
                              <Icon icon="mdi:magnify" className="h-4 w-4" />
                              მოძებნე სხვა ავტომობილი
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
                                  საუკეთესო ტრანსპორტირების ფასი
                                </div>
                                <div className="text-sm font-semibold">
                                  {formatMoney(bestQuote.breakdown?.shipping_total ?? null) ?? '—'}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  ტრანსპორტირება აშშ-დან საქართველოს პორტამდე (სხვა მომსახურება ცალკე ითვლება)
                                </div>
                                <div className="mt-1 text-sm font-semibold text-foreground">
                                  {bestQuote.company_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  სრული მომსახურება აშშ-დან საქართველოს პორტამდე.
                                </div>
                                {bestQuote.delivery_time_days != null && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    ორიენტირებით მიწოდება: {bestQuote.delivery_time_days} დღე
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
                                შენ შეიძლება დაზოგო დაახლოებით{' '}
                                <span className="font-semibold">
                                  ${savingsAmount.toLocaleString()} USD
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground">
                              კომპანიების ფილტრი
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
                                ≥ 4.5 ★
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
                                სწრაფი მიწოდება
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3" role="list" aria-label="კომპანიების შეთავაზებების სია">
                            <AnimatePresence initial={false}>
                              {premiumQuotes.length > 0 && !showOnlyStandard && (
                                <>
                                  <div className="text-[11px] font-medium text-foreground flex items-center gap-1">
                                    <Icon icon="mdi:crown" className="h-3 w-3 text-amber-400" />
                                    <span>Premium / VIP შეთავაზებები</span>
                                  </div>
                                  {premiumQuotes.map(({ quote, vipLabel }) => {
                                    const companyMeta = mockCompanies.find(
                                      (company) => company.name === quote.company_name,
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

                                    if (!passesRating || !passesFastDelivery) {
                                      return null
                                    }

                                    return (
                                      <motion.div
                                        key={`${quote.company_name}-${quote.total_price}`}
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
                                                  ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
                                                  : 'border-slate-300/70'),
                                            isSelected &&
                                              'border-primary shadow-[0_0_0_1px_rgba(16,185,129,0.6)]',
                                          )}
                                          role="listitem"
                                          onClick={() => handleOpenCompanyPage(quote)}
                                          tabIndex={0}
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
                                                <span>({companyMeta.reviewCount} შეფასება)</span>
                                              </div>
                                            )}
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span>ტრანსპორტირების ფასი აშშ-დან საქართველოს პორტამდე</span>
                                                {isDiscounted && (
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                        <Icon icon="mdi:tag" className="h-3 w-3" />
                                                        ფასდაკლება
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                      <span>
                                                        დაახლოებითი ეკონომია:
                                                        {averageTotalPrice != null
                                                          ? ` $${(averageTotalPrice - quote.total_price).toLocaleString()} USD`
                                                          : ' ინდივიდუალური გათვლა'}
                                                        . ფასდაკლება აქტუალურია მიმდინარე კალკულაციისთვის და შეიძლება შეიცვალოს.
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
                                                მიწოდების მიახლოებითი დრო: {quote.delivery_time_days} დღე
                                              </div>
                                            )}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                    <Icon icon="mdi:shield-check" className="h-3 w-3" />
                                                    სანდო პარტნიორი
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                  <span>
                                                    სანდო პარტნიორი — ჩვენი შიდა შეფასებით და მომხმარებელთა გამოხმაურებებით შერჩეული იმპორტერი.
                                                  </span>
                                                </TooltipContent>
                                              </Tooltip>
                                              {(vipLabel?.includes('Diamond') || vipLabel?.includes('Gold')) && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                      <Icon icon="mdi:lock-check" className="h-3 w-3" />
                                                      დაცული გადახდა
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top">
                                                    <span>
                                                      დაცული გადახდა — თანხა იფიქსირება სანდო არხით, სანამ იმპორტერი არ დაადასტურებს მომსახურებას.
                                                    </span>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                              {vipLabel?.includes('Diamond') && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 px-2 py-[2px] text-[10px] font-medium cursor-help">
                                                      <Icon icon="mdi:file-check" className="h-3 w-3" />
                                                      დოკუმენტები სრულად
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top">
                                                    <span>
                                                      დოკუმენტები სრულად — იმპორტერი უზრუნველყოფს ყველა საჭირო იმპორტის და რეგისტრაციის დოკუმენტის მომზადებას.
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
                                                <span>დოკუმენტები</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>ტრანსპორტირება</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>საბაჟო</span>
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
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  setActiveBreakdownQuote(quote)
                                                }}
                                                aria-pressed={isActiveBreakdown}
                                                aria-label="გამოყავი საფასური ამ კომპანიის შეთავაზებისთვის"
                                              >
                                                <Icon icon="mdi:receipt-text" className="h-3 w-3" />
                                                კალკულაცია
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] flex items-center gap-1 transition-all duration-200"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  handleSelectQuote(quote)
                                                }}
                                                aria-pressed={isSelected}
                                                aria-label="აირჩიე ეს შეთავაზება"
                                              >
                                                {isSelected && (
                                                  <Icon
                                                    icon="mdi:check-circle"
                                                    className="h-3 w-3 transition-opacity duration-200"
                                                  />
                                                )}
                                                <span>{isSelected ? 'არჩეულია' : 'არჩევა'}</span>
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
                                    <span>სტანდარტული შეთავაზებები — უფრო დაბალი ფასით</span>
                                  </div>
                                  {standardQuotes.map(({ quote, vipLabel }) => {
                                    const companyMeta = mockCompanies.find(
                                      (company) => company.name === quote.company_name,
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

                                    const isActiveBreakdown =
                                      activeBreakdownQuote?.company_name === quote.company_name
                                    const isSelected =
                                      selectedQuote?.company_name === quote.company_name

                                    return (
                                      <motion.div
                                        key={`${quote.company_name}-${quote.total_price}`}
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
                                                  ? 'border-amber-400/70 shadow-[0_0_0_1px_rgба(251,191,36,0.5)]'
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
                                                <span>({companyMeta.reviewCount} შეფასება)</span>
                                              </div>
                                            )}
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span>ტრანსპორტირების ფასი აშშ-დან საქართველოს პორტამდე</span>
                                                {isDiscounted && (
                                                  <span className="inline-flex itemsორცნер gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium">
                                                    <Icon icon="mdi:tag" className="h-3 w-3" />
                                                    ფასდაკლება
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
                                                მიწოდების მიახლოებითი დრო: {quote.delivery_time_days} დღე
                                              </div>
                                            )}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium">
                                                <Icon icon="mdi:shield-check" className="h-3 w-3" />
                                                სანდო პარტნიორი
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
                                                <span>დოკუმენტები</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesTransport ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesTransport ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>ტრანსპორტირება</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1">
                                                <Icon
                                                  icon={includesCustoms ? 'mdi:check-bold' : 'mdi:close-thick'}
                                                  className={cn(
                                                    'h-3 w-3',
                                                    includesCustoms ? 'text-emerald-500' : 'text-slate-400',
                                                  )}
                                                />
                                                <span>საბაჟო</span>
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
                                                aria-label="გამოყავი საფასური ამ კომპანიის შეთავაზებისთვის"
                                              >
                                                <Icon icon="mdi:receipt-text" className="h-3 w-3" />
                                                კალკულაცია
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] flex items-center gap-1 transition-all duration-200"
                                                onClick={() => handleSelectQuote(quote)}
                                                aria-pressed={isSelected}
                                                aria-label="აირჩიე ეს შეთავაზება"
                                              >
                                                {isSelected && (
                                                  <Icon
                                                    icon="mdi:check-circle"
                                                    className="h-3 w-3 transition-opacity duration-200"
                                                  />
                                                )}
                                                <span>{isSelected ? 'არჩეულია' : 'არჩევა'}</span>
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

                          {mockRecentCases.length > 0 && (
                            <div className="mt-3 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                                <Icon icon="mdi:clock-check" className="h-3 w-3" />
                                <span>ბოლო წარმატებული იმპორტის მაგალითები</span>
                              </div>
                              <ul className="space-y-[2px]">
                                {mockRecentCases.slice(0, 3).map((item: { id: string; make: string; model: string; from: string; to: string; days: number }) => (
                                  <li key={item.id} className="flex items-start gap-1">
                                    <span className="mt-[2px] text-[9px] text-muted-foreground">•</span>
                                    <span>
                                      <span className="font-medium">{item.make} {item.model}</span>
                                      {" — იმპორტი "}
                                      <span className="font-medium">{item.from}→{item.to}</span>
                                      {`, დასრულდა ${item.days} დღეში`}
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
                              className="h-8 px-3 text-[11px] flex items-center gap-1"
                              onClick={() => navigate('/auction-listings')}
                            >
                              <Icon icon="mdi:car-search" className="h-4 w-4" />
                              ნახე სხვა აქტიური აუქციონები
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
                  ავტომობილი ვერ მოიძებნა. სცადეთ კიდევ ერთხელ ან დაბრუნდით ძიებაზე.
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-xs mt-4">
            <div>
              <div className="font-medium text-sm">გაგრძელე მუშაობა შეთავაზებებთან</div>
              <div className="text-muted-foreground mt-1">
                შეადარე კომპანიები, აირჩიე საუკეთესო და დაბრუნდი კატალოგში ახალი ავტომობილის სანახავად.
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={() => navigate('/catalog')}
                aria-label="დაბრუნდი კომპანიების კატალოგში"
              >
                <Icon icon="mdi:view-grid" className="h-4 w-4" />
                კატალოგში დაბრუნება
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={handleScrollToOffers}
                aria-label="გადადი კომპანიების შეთავაზებების სექციაზე"
              >
                <Icon icon="mdi:car-info" className="h-4 w-4" />
                ნახე შეთავაზებები
              </Button>
            </div>
          </div>
          </div>
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />

      {isOrderPopupOpen && selectedQuote && (
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 transition-opacity duration-200 ease-out',
            isOrderPopupEntering ? 'opacity-100' : 'opacity-0',
          )}
          role="dialog"
          aria-modal="true"
          aria-label={`შეკვეთის გაფორმება - ${selectedQuote.company_name}`}
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
              aria-label="დახურე შეკვეთის გაფორმების ფანჯარა"
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-base font-semibold mb-1">შეკვეთის გაფორმება</div>
                <div className="text-[11px] text-muted-foreground">
                  კომპანია: {selectedQuote.company_name}
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div>
                  სრული ფასი იმპორტზე: <span className="font-semibold">${selectedQuote.total_price.toLocaleString()} USD</span>
                </div>
                {selectedQuote.delivery_time_days != null && (
                  <div>
                    მიწოდების მიახლოებითი დრო: {selectedQuote.delivery_time_days} დღე
                  </div>
                )}
              </div>
              <form className="space-y-3 mt-2" onSubmit={handleSubmitOrder}>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium" htmlFor="order-name">
                    სახელი
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
                    ტელეფონი
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
                    კომენტარი / დამატებითი სურვილები
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
                    გაუქმება
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 text-[11px]"
                  >
                    გაგზავნა განაცხადი
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
          aria-label={`განაცხადი მიღებულია - ${selectedQuote.company_name}`}
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
              aria-label="დახურე დადასტურების ფანჯარა"
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </button>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-base font-semibold mb-1">განაცხადი მიღებულია</div>
                <div className="text-[11px] text-muted-foreground">
                  კომპანია: {selectedQuote.company_name}
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div>
                  სრული ფასი იმპორტზე:{' '}
                  <span className="font-semibold">
                    ${selectedQuote.total_price.toLocaleString()} USD
                  </span>
                </div>
                {selectedQuote.delivery_time_days != null && (
                  <div>მიწოდების მიახლოებითი დრო: {selectedQuote.delivery_time_days} დღე</div>
                )}
                <div className="mt-1">
                  ჩვენ გადავცემთ თქვენს განაცხადს იმპორტერს და ის დაგიკავშირდებათ უახლოეს სამუშაო დღეს.
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
                  დაუკავშირდი იმპორტერს
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
                  გადადი კომპანიის გვერდზე
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
          aria-label={`დეტალური ფასი იმპორტზე - ${activeBreakdownQuote.company_name}`}
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
              aria-label="დახურე ფასის დეტალური ჩეკი"
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
          aria-label="ფოტოს სრულეკრანიანი ჩვენება"
        >
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="დახურვა"
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
