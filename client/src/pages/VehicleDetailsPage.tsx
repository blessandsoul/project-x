import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Header from '@/components/Header/index.tsx'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies, mockFooterLinks, mockNavigationItems } from '@/mocks/_mockData'
import { useVehicleDetails } from '@/hooks/useVehicleDetails'
import type { VehicleQuote } from '@/types/vehicles'
import { VipBadge } from '@/components/company/VipBadge'
import { cn } from '@/lib/utils'

const VehicleDetailsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id: string }>()
  const offersRef = useRef<HTMLDivElement | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isImageFading, setIsImageFading] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const vehicleId = useMemo(() => {
    if (!params.id) return null
    const parsed = Number(params.id)
    return Number.isFinite(parsed) ? parsed : null
  }, [params.id])

  const { vehicle, photos, quotes, distanceMiles, isLoading, error, isQuotesMock, recalculate } =
    useVehicleDetails(vehicleId)

  const liveViewersCount = useMemo(() => {
    if (!vehicleId) return null
    const base = (vehicleId % 5) + 3
    return base
  }, [vehicleId])

  useEffect(() => {
    setActivePhotoIndex(0)
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

  const sortedQuotes = useMemo<VehicleQuote[]>(() => {
    if (!quotes.length) return []

    return [...quotes].sort((a, b) => {
      if (a.total_price !== b.total_price) {
        return a.total_price - b.total_price
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

  const getVipLabelForIndex = (index: number): string | null => {
    if (index === 0) return 'Diamond VIP'
    if (index === 1) return 'Gold VIP'
    if (index === 2) return 'Silver VIP'
    return null
  }

  const handleScrollToOffers = () => {
    if (offersRef.current) {
      offersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
                      {vehicle.source}
                    </span>
                  </div>
                )}
                {vehicle && (
                  <Badge variant="outline" className="text-xs">
                    ID: {vehicle.id}
                  </Badge>
                )}
              </div>

              {isLoading && (
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

              {!isLoading && error && (
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

              {!isLoading && !error && vehicle && (
                <div className="grid gap-6 md:grid-cols-3">
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
                            <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                              {photos.slice(0, 7).map((photo, index) => (
                                <button
                                  key={photo.id}
                                  type="button"
                                  className={cn(
                                    'flex-shrink-0 w-24 h-20 md:w-28 md:h-20 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                    index === activePhotoIndex ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100',
                                  )}
                                  onClick={() => {
                                    if (index === activePhotoIndex) return
                                    setActivePhotoIndex(index)
                                  }}
                                  aria-label="აირჩიე ეს ფოტო გასადიდებლად"
                                >
                                  <img
                                    src={photo.thumb_url || photo.url}
                                    alt="thumb"
                                    className="w-full h-full object-cover rounded-md overflow-hidden"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-muted rounded-md text-xs text-muted-foreground gap-2">
                          <Icon icon="mdi:image-off" className="h-5 w-5" />
                          <span>ფოტოები მიუწვდომელია</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-4">
                        {liveViewersCount != null && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                            <Icon icon="mdi:eye" className="h-3 w-3" />
                            ამ ავტომობილს ახლა ათვალიერებს {liveViewersCount} ადამიანი
                          </span>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="rounded-md border bg-muted/40 px-3 py-2">
                            <span className="block text-[11px] text-muted-foreground">
                              სავაჭრო ღირებულება
                            </span>
                            <span className="font-medium">${String(vehicle.retail_value)}</span>
                          </div>
                          <div className="rounded-md border bg-muted/40 px-3 py-2">
                            <span className="block text-[11px] text-muted-foreground">Auction ფასი</span>
                            <span className="font-medium">${String(vehicle.calc_price)}</span>
                          </div>
                          {distanceMiles != null && (
                            <div className="rounded-md border bg-muted/40 px-3 py-2">
                              <span className="block text-[11px] text-muted-foreground">დისტანცია</span>
                              <span className="font-medium">{distanceMiles.toLocaleString()} mi</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col" ref={offersRef}>
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
                              onClick={recalculate}
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
                        <span className="text-[11px] text-muted-foreground">
                          ფასი მოიცავს ტრანსპორტირებას, მომსახურებისა და საბროკერო საფასურს, საბაჟო და სხვა გადასახადები წარმოდგენილია დაახლოებით.
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-xs space-y-4">
                      {isLoading && (
                        <div className="space-y-2" aria-busy="true">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-14 w-full" />
                          <Skeleton className="h-14 w-full" />
                        </div>
                      )}
                      {!sortedQuotes.length && (
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
                              onClick={() => navigate('/search')}
                            >
                              <Icon icon="mdi:magnify" className="h-4 w-4" />
                              მოძებნე სხვა ავტომობილი
                            </Button>
                          </div>
                        </div>
                      )}

                      {sortedQuotes.length > 0 && (
                        <div className="space-y-4">
                          {isQuotesMock && (
                            <p className="text-[10px] text-muted-foreground">
                              *ამ ეტაპზე გამოყენებულია დემო-გამოთვლები (mock მონაცემები). რეალური API შეთავაზებები ჯერ არ არის ჩართული.
                            </p>
                          )}
                          {bestQuote && (
                            <div className="p-3 rounded-md border bg-muted/40 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[11px] text-muted-foreground mb-1">საუკეთესო სრული ფასი იმპორტზე</div>
                                <div className="text-sm font-semibold">
                                  ${bestQuote.total_price.toLocaleString()} USD
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  კომპანია: {bestQuote.company_name} — სრული მომსახურება აშშ-დან საქართველოს პორტამდე.
                                </div>
                                {bestQuote.delivery_time_days != null && (
                                  <div className="text-[11px] text-muted-foreground">
                                    ориентირებით მიწოდება: {bestQuote.delivery_time_days} დღე
                                  </div>
                                )}
                              </div>
                              <Icon icon="mdi:star" className="h-6 w-6 text-amber-400" />
                            </div>
                          )}

                          <div className="space-y-3" role="list" aria-label="კომპანიების შეთავაზებების სია">
                            {sortedQuotes.map((quote, index) => {
                              const vipLabel = getVipLabelForIndex(index)
                              const companyMeta = mockCompanies.find((company) => company.name === quote.company_name)

                              return (
                                <div
                                  key={`${quote.company_name}-{quote.total_price}`}
                                  className={cn(
                                    'flex items-start justify-between gap-3 rounded-md px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    vipLabel &&
                                      (vipLabel.includes('Diamond')
                                        ? 'border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.5)]'
                                        : vipLabel.includes('Gold')
                                          ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
                                          : 'border-slate-300/70'),
                                  )}
                                  role="listitem"
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium text-xs">{quote.company_name}</div>
                                    {companyMeta && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Icon icon="mdi:star" className="h-3 w-3 text-amber-400" />
                                        <span>{companyMeta.rating.toFixed(1)}</span>
                                        <span>
                                          ({companyMeta.reviewCount} შეფასება)
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-[11px] text-muted-foreground">
                                      სრული ფასი იმპორტზე: ${quote.total_price.toLocaleString()} USD
                                    </div>
                                    {quote.delivery_time_days != null && (
                                      <div className="text-[11px] text-muted-foreground">
                                        მიწოდების მიახლოებითი დრო: {quote.delivery_time_days} დღე
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {/* Trust badges: vary by VIP level / index */}
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-[2px] text-[10px] font-medium">
                                        <Icon icon="mdi:shield-check" className="h-3 w-3" />
                                        სანდო პარტნიორი
                                      </span>
                                      {(vipLabel?.includes('Diamond') || vipLabel?.includes('Gold')) && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-[2px] text-[10px] font-medium">
                                          <Icon icon="mdi:lock-check" className="h-3 w-3" />
                                          დაცული გადახდა
                                        </span>
                                      )}
                                      {vipLabel?.includes('Diamond') && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 px-2 py-[2px] text-[10px] font-medium">
                                          <Icon icon="mdi:file-check" className="h-3 w-3" />
                                          დოკუმენტები სრულად
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {vipLabel && <VipBadge label={vipLabel} />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
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
              {!isLoading && !error && !vehicle && (
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
