import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
// Header and Footer are provided by MainLayout
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody } from '@/components/ui/table'
import { Icon } from '@iconify/react/dist/iconify.js'
// navigationItems now handled by MainLayout
import { AuctionVehicleListItem } from '@/components/auction/AuctionVehicleListItem'
import { useVehicleWatchlist } from '@/hooks/useVehicleWatchlist'
import { useCalculateVehicleQuotes } from '@/hooks/useCalculateVehicleQuotes'
import { fetchWatchlist } from '@/api/watchlist'
import type { VehicleSearchItem } from '@/types/vehicles'
import { useTranslation } from 'react-i18next'

const FavoriteVehiclesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isWatched, toggleWatch, isLoading: isWatchlistLoading } = useVehicleWatchlist()
  const { data: calcData, isLoading: isCalcLoading, error: calcError, calculateQuotes } =
    useCalculateVehicleQuotes()
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false)

  const [items, setItems] = useState<VehicleSearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)

    fetchWatchlist(1, 100)
      .then((response) => {
        if (!isMounted) return
        setItems(response.items)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        console.error('[FavoriteVehiclesPage] Failed to load favorites', err)
        setError('Failed to load favorite vehicles')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const isBusy = isLoading || isWatchlistLoading

  const randomCalcQuote = useMemo(() => {
    if (!calcData || !calcData.quotes || calcData.quotes.length === 0) {
      return null
    }

    const index = Math.floor(Math.random() * calcData.quotes.length)
    return calcData.quotes[index]
  }, [calcData])

  const formatMoney = (
    value: number | string | null | undefined,
    currency: 'USD' | 'GEL' = 'USD',
  ): string | null => {
    if (value == null) return null

    const numeric = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numeric)) return null

    if (currency === 'GEL') {
      return `${numeric.toLocaleString()} GEL`
    }

    return `$${numeric.toLocaleString()}`
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <main
        className="flex-1 flex flex-col"
        role="main"
        aria-label={t('auction.favorite_vehicles')}
      >
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {t('auction.favorite_vehicles')}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                {t('auction.favorite_vehicles_description')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Content Grid */}
            <div className="min-h-[400px]">
              {isBusy && items.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden rounded-xl border-border/50 flex flex-row sm:flex-col"
                    >
                      <Skeleton className="w-28 h-20 sm:w-full sm:aspect-[4/3] sm:h-auto flex-shrink-0" />
                      <CardContent className="p-2 sm:p-4 space-y-1 sm:space-y-3 flex-1">
                        <Skeleton className="h-4 sm:h-5 w-3/4" />
                        <Skeleton className="h-3 sm:h-4 w-1/2" />
                        <div className="flex justify-between pt-1 sm:pt-2">
                          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                          <Skeleton className="h-6 sm:h-8 w-14 sm:w-8 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-xl bg-destructive/5 border-destructive/20">
                  <Icon icon="mdi:alert-circle-outline" className="w-12 h-12 text-destructive" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-destructive">
                      {t('error.failed_to_load_data')}
                    </h3>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    {t('common.retry')}
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-xl bg-muted/30 border-dashed">
                  <Icon icon="mdi:star-outline" className="w-12 h-12 text-muted-foreground/50" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t('auction.no_favorites')}</h3>
                  </div>
                  <Button variant="outline" onClick={() => navigate({ pathname: '/auction-listings' })}>
                    {t('auction.browse_auctions')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${item.vehicle_id}`} className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableBody>
                          <AuctionVehicleListItem
                            item={item}
                            priority={idx < 4}
                            isSelected={false}
                            showCompareCheckbox={false}
                            isWatched={isWatched(item.vehicle_id ?? item.id)}
                            hideExtraColumns={true}
                            onToggleWatch={() => {
                              const id = item.vehicle_id ?? item.id
                              toggleWatch(id)
                            }}
                            onCalculate={() => {
                              const id = item.vehicle_id ?? item.id
                              setIsCalcModalOpen(true)
                              calculateQuotes(id)
                            }}
                            onViewDetails={() => {
                              const id = item.vehicle_id ?? item.id
                              navigate({ pathname: `/vehicle/${id}` })
                            }}
                          />
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Calculator Modal (reuse from AuctionListingsPage) */}
      <AnimatePresence>
        {isCalcModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCalcModalOpen(false)}
          >
            <motion.div
              className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t('auction.calculate_cost')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsCalcModalOpen(false)}>
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                {isCalcLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Icon icon="mdi:calculator" className="w-8 h-8 animate-bounce text-primary" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                ) : calcError ? (
                  <div className="text-center text-destructive py-4">{t('error.generic')}</div>
                ) : randomCalcQuote ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('auction.estimated_total')}
                      </p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {formatMoney(randomCalcQuote.total_price)}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{t('auction.shipping')}</span>
                        <span>{formatMoney(randomCalcQuote.breakdown.shipping_total)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{t('auction.fees')}</span>
                        <span>
                          {formatMoney(
                            randomCalcQuote.breakdown.service_fee +
                            randomCalcQuote.breakdown.broker_fee,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{t('auction.customs')}</span>
                        <span>{formatMoney(randomCalcQuote.breakdown.customs_fee)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FavoriteVehiclesPage
