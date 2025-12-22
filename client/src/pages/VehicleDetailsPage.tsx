import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { formatDateTime } from '@/lib/formatDate'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'framer-motion'

// Components
// VehicleLayout removed - Header/Footer now provided by MainLayout
import { Button } from '@/components/ui/button'
// Card components kept for potential future use
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
// Tooltip components kept for potential future use
// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
// Table components kept for potential future use
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Hooks & Utils
import { useVehicleDetails } from '@/hooks/useVehicleDetails'
import { useVehicleWatchlist } from '@/hooks/useVehicleWatchlist'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { VehicleQuote, VehicleSearchItem } from '@/types/vehicles'
import { fetchSimilarVehicles } from '@/api/vehicles'
import { SimilarVehicleCard } from '@/components/vehicle/SimilarVehicleCard'
import VehicleHeaderBar from '@/components/vehicle/VehicleHeaderBar'
import VehicleQuotesContainer from '@/components/vehicle/VehicleQuotesContainer'
// import { useInquiryDrawer } from '@/contexts/InquiryDrawerContext' // Disabled - inquiry system not ready

// --- Sub-components ---

const SuccessModal = ({ isOpen, onClose, count }: { isOpen: boolean; onClose: () => void; count: number }) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval: ReturnType<typeof setInterval> = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[380px]">
        {/* Success Animation Circle */}
        <div className="flex justify-center -mt-2 mb-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <Icon icon="mdi:check-bold" className="h-10 w-10 text-white" />
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl">{t('vehicle.success_modal.title')}</DialogTitle>
          <DialogDescription>
            {t('vehicle.success_modal.description', { count })}
          </DialogDescription>
        </DialogHeader>

        {/* Info Card */}
        <div className="bg-slate-50 rounded-xl p-4 my-2">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Icon icon="mdi:headset" className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('vehicle.success_modal.manager_contact')}
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pt-2">
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25"
          >
            <Icon icon="mdi:check-circle" className="h-5 w-5 mr-2" />
            {t('common.great_thanks')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* UNUSED COMPONENTS - Commented out to fix build
const AuctionTimer = ({ dateStr }: { dateStr?: string | null }) => {
    const { t } = useTranslation()
    const targetDate = useMemo(() => {
        const d = dateStr ? new Date(dateStr) : new Date()
        if (isNaN(d.getTime()) || d < new Date()) {
            d.setHours(d.getHours() + 4) 
            d.setMinutes(12)
        }
        return d
    }, [dateStr])

    const [timeLeft, setTimeLeft] = useState("")

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const diff = targetDate.getTime() - now.getTime()
            
            if (diff <= 0) {
                setTimeLeft(t('vehicle.started'))
                return
            }

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`)
        }, 1000)
        return () => clearInterval(interval)
    }, [targetDate, t])

    return (
        <div className="flex items-center gap-1.5 text-red-600/90 bg-red-50/50 px-2 py-1 rounded-md border border-red-100/50">
            <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{t('vehicle.ends_in')}</span>
            <span className="font-mono font-bold text-xs tabular-nums">{timeLeft}</span>
        </div>
    )
}

const MarketPriceWidget = ({ price }: { price: number }) => {
    const { t } = useTranslation()
    const marketPrice = Math.round(price * 1.2)
    const savings = marketPrice - price
    const percent = Math.round((savings / marketPrice) * 100)

    return (
        <div className="mt-4 pt-4 border-t border-dashed">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{t('vehicle.market_average')}</span>
                <span className="text-xs font-medium text-muted-foreground line-through decoration-red-400/50">${marketPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <Icon icon="mdi:trending-down" className="h-4 w-4" />
                    <span>{t('vehicle.below_market', { percent })}</span>
                </div>
                <span className="font-bold text-emerald-700">{t('vehicle.save_amount', { amount: savings.toLocaleString() })}</span>
            </div>
        </div>
    )
}
*/

// @ts-ignore - Component reserved for future use
const DamageViewer = ({ vehicle }: { vehicle: any }) => {
  const { t } = useTranslation()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const damagePrimary = vehicle?.damage_main_damages || "HARDCODED"
  const damageSecondary = vehicle?.damage_secondary_damages || "HARDCODED"
  const hasKeys = vehicle?.has_keys || vehicle?.has_keys_readable === 'YES'
  const runAndDrive = vehicle?.run_and_drive || "HARDCODED"
  const estValue = Number(vehicle?.est_retail_value) || 0

  const handleUnlock = () => {
    setIsLiking(true)
    setTimeout(() => {
      setIsLiking(false)
      setIsUnlocked(true)
    }, 1500)
  }

  // Use variables to prevent unused warnings
  console.debug(isUnlocked, isLiking, handleUnlock, damagePrimary, damageSecondary, hasKeys, runAndDrive, estValue)

  return (
    <div className="bg-card rounded-xl border shadow-sm p-3 sm:p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Icon icon="mdi:car-info" className="text-muted-foreground" />
          {t('vehicle.condition_report')}
        </h3>
        <Badge variant="outline" className="font-normal text-[10px] text-muted-foreground">{t('vehicle.ai_analysis')}</Badge>
      </div>

      <div className={cn("flex flex-row gap-3 sm:gap-8 transition-all duration-500", !isUnlocked && "blur-[2px] sm:blur-md opacity-60 select-none pointer-events-none")}>
        {/* Left: Visual + Damage Tags - Compact on Mobile */}
        <div className="flex gap-3 sm:gap-6 flex-shrink-0">
          {/* SVG Skeleton - Smaller on Mobile */}
          <div className="relative w-16 h-28 sm:w-24 sm:h-40 flex-shrink-0 opacity-80">
            <svg viewBox="0 0 100 200" className="w-full h-full text-muted-foreground/30">
              <path d="M20,40 Q20,10 50,10 Q80,10 80,40 L80,160 Q80,190 50,190 Q20,190 20,160 Z" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="10" y="45" width="10" height="20" rx="2" fill="currentColor" />
              <rect x="80" y="45" width="10" height="20" rx="2" fill="currentColor" />
              <rect x="10" y="135" width="10" height="20" rx="2" fill="currentColor" />
              <rect x="80" y="135" width="10" height="20" rx="2" fill="currentColor" />
            </svg>
            {/* Damage Highlight - Minimalist Dot */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
              </div>
            </div>
          </div>

          {/* Damage Details - Compact */}
          <div className="space-y-2 sm:space-y-3 pt-1">
            <div>
              <span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-0.5">{t('vehicle.primary_damage')}</span>
              <div className="text-red-600 font-bold text-xs sm:text-sm flex items-center gap-1 leading-tight">
                <Icon icon="mdi:alert-circle" className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {damagePrimary}
              </div>
            </div>
            <div>
              <span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-0.5">{t('vehicle.secondary_damage')}</span>
              <div className="text-amber-600 font-medium text-[10px] sm:text-xs flex items-center gap-1 leading-tight">
                <Icon icon="mdi:alert-outline" className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {damageSecondary}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Estimate & Tech Specs - Stacked tightly */}
        <div className="flex-1 w-full grid grid-cols-1 gap-3 sm:gap-6 border-l border-border/50 pl-3 sm:pl-6">
          {/* Estimate Block */}
          <div className="space-y-1.5 sm:space-y-3">
            <div className="pl-2 sm:pl-3 border-l-2 border-blue-500/50">
              <div className="text-[8px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{t('vehicle.ai_repair_estimate')}</div>
              <div className="text-sm sm:text-xl font-bold text-foreground tracking-tight">
                HARDCODED
              </div>
            </div>
            <div className="bg-muted/20 rounded p-1.5 sm:p-2.5 flex justify-between items-center">
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">{t('vehicle.retail_value')}</span>
              <span className="text-[10px] sm:text-xs font-bold">${estValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Technical Status - 2 cols on mobile too */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            <div className="bg-muted/10 rounded p-1.5 sm:p-2 border border-transparent hover:border-border transition-colors">
              <div className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">{t('vehicle.engine_status')}</div>
              <div className="text-[10px] sm:text-xs font-medium flex items-center gap-1 text-emerald-600">
                <Icon icon="mdi:engine" className="h-3 w-3" />
                <span className="truncate">{runAndDrive}</span>
              </div>
            </div>
            <div className="bg-muted/10 rounded p-1.5 sm:p-2 border border-transparent hover:border-border transition-colors">
              <div className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">{t('vehicle.keys')}</div>
              <div className={cn("text-[10px] sm:text-xs font-medium flex items-center gap-1", hasKeys ? "text-emerald-600" : "text-red-500")}>
                <Icon icon={hasKeys ? "mdi:key-variant" : "mdi:key-variant-off"} className="h-3 w-3" />
                <span className="truncate">{hasKeys ? t('vehicle.keys_present') : t('vehicle.keys_missing')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Overlay */}
      {/* 
            {!isUnlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] p-4 text-center">
                    <div className="bg-background/95 p-4 sm:p-6 rounded-xl shadow-lg border border-border/50 max-w-xs space-y-3 sm:space-y-4">
                        <div className="mx-auto w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Icon icon="mdi:facebook" className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-xs sm:text-sm">{t('vehicle.unlock_report')}</h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('vehicle.unlock_desc')}</p>
                        </div>
                        <Button 
                            onClick={handleUnlock} 
                            className="w-full bg-primary hover:bg-[#1864D9] text-white h-8 sm:h-9 text-[10px] sm:text-xs font-medium gap-2"
                            disabled={isLiking}
                        >
                            {isLiking ? (
                                <>
                                    <Icon icon="mdi:loading" className="h-3 w-3 animate-spin" />
                                    {t('vehicle.verifying')}
                                </>
                            ) : (
                                <>
                                    <Icon icon="mdi:thumb-up" className="h-3 w-3" />
                                    {t('vehicle.like_facebook')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            */}
    </div>
  )
}

const QuoteBreakdownModal = ({
  quote,
  isOpen,
  onClose
}: {
  quote: VehicleQuote | null;
  isOpen: boolean;
  onClose: () => void
}) => {
  const { t } = useTranslation()
  if (!quote) return null

  // Helper to safely format numbers
  const fmt = (val: number | undefined | null) => val ? `$${Number(val).toLocaleString()}` : '—'

  // New simplified breakdown from calculator API
  // The API now returns transportation_total as the main price
  const transportationTotal = quote.breakdown?.transportation_total ?? quote.total_price
  const currency = quote.breakdown?.currency ?? 'USD'

  // Build breakdown items - show transportation total as the main item
  // Legacy fields are shown only if present (for backward compatibility)
  const breakdownItems = [
    {
      icon: 'mdi:truck-delivery',
      label: t('vehicle.shipping_total'),
      value: transportationTotal,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isMain: true,
    },
    // Legacy fields - only show if present in response
    ...(quote.breakdown?.customs_fee != null ? [{
      icon: 'mdi:file-document-check',
      label: t('vehicle.customs_clearance'),
      value: quote.breakdown.customs_fee,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }] : []),
    ...(quote.breakdown?.broker_fee != null ? [{
      icon: 'mdi:handshake',
      label: t('vehicle.broker_fees'),
      value: quote.breakdown.broker_fee,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }] : []),
    ...(quote.breakdown?.insurance_fee != null ? [{
      icon: 'mdi:shield-check',
      label: t('vehicle.insurance_optional'),
      value: quote.breakdown.insurance_fee,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50',
      isOptional: true
    }] : []),
  ]

  // Suppress unused variable warning
  void currency

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        {/* Header Icon */}
        <div className="flex justify-center -mt-2 mb-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-primary/10 flex items-center justify-center shadow-sm">
            <Icon icon="mdi:calculator-variant" className="h-7 w-7 text-primary" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle>{t('vehicle.price_breakdown')}</DialogTitle>
          <DialogDescription>
            {t('vehicle.detailed_quote')} <span className="font-semibold text-slate-700">{quote.company_name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Breakdown Items */}
        <div className="space-y-3 my-2">
          {breakdownItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-all",
                item.isOptional ? "bg-slate-50/50" : "bg-slate-50 hover:bg-slate-100/80"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", item.bgColor)}>
                  <Icon icon={item.icon} className={cn("h-4.5 w-4.5", item.color)} />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  item.isOptional ? "text-slate-400" : "text-slate-700"
                )}>
                  {item.label}
                  {item.isOptional && <span className="text-[10px] ml-1 text-slate-400">(opt)</span>}
                </span>
              </div>
              <span className={cn(
                "font-bold tabular-nums",
                item.isOptional ? "text-slate-400 text-sm" : "text-slate-900"
              )}>
                {fmt(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 p-4 rounded-xl border border-primary/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:sigma" className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary uppercase text-xs tracking-wider">{t('vehicle.total_estimated')}</span>
            </div>
            <span className="font-black text-2xl text-slate-900">{fmt(quote.total_price)}</span>
          </div>
        </div>

        {/* Note */}
        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 mt-2">
          <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />
          {t('vehicle.price_note')}
        </p>
      </DialogContent>
    </Dialog>
  )
}

// Copart-style Gallery - exactly like screenshot
const CopartGallery = ({ photos }: { photos: any[] }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!photos.length) {
    return <div className="aspect-[4/3] w-full bg-slate-200 flex items-center justify-center text-slate-400">No Photos</div>
  }

  const handlePrev = () => setActiveIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
  const handleNext = () => setActiveIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/70 shadow-sm">
        <img
          src={photos[activeIndex]?.url}
          alt="Vehicle"
          className="w-full aspect-[4/3] object-cover"
        />

        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/90 rounded-full flex items-center justify-center hover:bg-background shadow-sm border border-border/60"
        >
          <Icon icon="mdi:chevron-left" className="w-5 h-5 text-foreground/80" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/90 rounded-full flex items-center justify-center hover:bg-background shadow-sm border border-border/60"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5 text-foreground/80" />
        </button>

        {/* Photo counter */}
        <div className="absolute bottom-3 right-3 bg-background text-foreground text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5 border border-border/60 shadow-sm">
          <Icon icon="mdi:camera" className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="tabular-nums">{activeIndex + 1}/{photos.length}</span>
        </div>
      </div>

      {/* Thumbnails */}
      {/* Mobile overflow fix: 3 cols on tiny screens (<410px), 5 cols on sm, 7 cols on md+ */}
      <div className="copart-gallery-thumbs grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-1.5 min-w-0">
        {photos.slice(0, 14).map((photo, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg border transition-all bg-muted",
              activeIndex === idx
                ? "border-primary ring-1 ring-primary/70"
                : "border-transparent opacity-80 hover:opacity-100"
            )}
          >
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// CopartVehicleInfo component removed - will be replaced with new implementation

// VehicleGallery component kept for potential future use - now using CopartGallery

// VehicleSpecs component kept for potential future use
// QuoteRow component kept for potential future use - now using inline company cards

const SimilarVehicles = ({ baseVehicleId }: { baseVehicleId: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isWatched, toggleWatch } = useVehicleWatchlist()
  const [similarItems, setSimilarItems] = useState<VehicleSearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchSimilarVehicles(baseVehicleId, { limit: 20 })
        if (!isMounted) return
        const items = Array.isArray(response.items) ? response.items : []
        // Cap to a maximum of 10 similar vehicles to keep the strip compact
        setSimilarItems(items.slice(0, 10))
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Failed to load similar vehicles'
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [baseVehicleId])

  const handleToggleWatch = useCallback((vehicleId: number) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    toggleWatch(vehicleId)
  }, [isAuthenticated, navigate, toggleWatch])

  // Note: Desktop autoplay removed to avoid unexpected jumping/scrolling

  if (isLoading) {
    return (
      <section className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl hidden sm:block" />
          <Skeleton className="h-64 rounded-xl hidden sm:block" />
        </div>
      </section>
    )
  }

  if (error || !similarItems.length) {
    return null
  }

  return (
    <motion.section
      className="similar-vehicles-section space-y-4 pt-8 border-t overflow-hidden"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
      </div>

      {/* Horizontal scrolling carousel for similar vehicles */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {similarItems.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-[240px] min-[460px]:w-[280px] min-[500px]:w-[340px] sm:w-[380px] md:w-[420px] lg:w-[400px] snap-start">
            <SimilarVehicleCard
              item={item}
              priority={false}
              onViewDetails={() => navigate({ pathname: `/vehicle/${item.id}` })}
              onToggleWatch={() => handleToggleWatch(item.id)}
              isWatched={isWatched(item.id)}
            />
          </div>
        ))}
      </div>
    </motion.section>
  )
}

// --- Main Page Component ---

const VehicleDetailsPage = () => {
  // TEMPORARY DEBUG: Track renders
  console.count('VehicleDetailsPage render')

  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // NOTE: Do NOT use useSearchParams - it causes re-renders on ANY query param change
  // Instead, read initial params directly from window.location.search (only once on mount)
  const shouldReduceMotion = useReducedMotion()
  const { isAuthenticated, userRole } = useAuth()
  const { isWatched, toggleWatch, isLoading: isWatchlistLoading } = useVehicleWatchlist()

  // Parse URL params for initial values - use ref to only read once on mount
  // Using window.location.search instead of useSearchParams to avoid re-renders
  const initialParamsRef = useRef<{ limit: number; rating: number | null } | null>(null)
  if (initialParamsRef.current === null) {
    const searchParams = new URLSearchParams(window.location.search)
    const urlLimit = searchParams.get('limit')
    const urlRating = searchParams.get('rating')
    const parsedLimit = urlLimit ? parseInt(urlLimit, 10) : 5
    const parsedRating = urlRating ? parseFloat(urlRating) : null
    initialParamsRef.current = {
      limit: [5, 10, 15].includes(parsedLimit) ? parsedLimit : 5,
      rating: parsedRating && parsedRating > 0 ? parsedRating : null,
    }
  }

  const {
    vehicle,
    photos,
    quotes,
    isLoading,
    priceAvailable,
    priceUnavailableMessage,
    // Unused but kept for potential future use
    minRating: _minRating,
  } = useVehicleDetails(id ? Number(id) : null, {
    initialLimit: initialParamsRef.current.limit,
    initialMinRating: initialParamsRef.current.rating,
  })

  // State: Selection & Unlock
  const [isMultiSelectMode, _setIsMultiSelectMode] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [hasUnlockedExtra, setHasUnlockedExtra] = useState(false)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
  const [activeBreakdownQuote, setActiveBreakdownQuote] = useState<VehicleQuote | null>(null)

  // State: Filters (local UI filters - VIP and Fast are client-side only)
  const [filterVip, _setFilterVip] = useState(false)
  const [filterFast, _setFilterFast] = useState(false)

  // State: Lead Modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State: Unlock Form
  const [unlockReview, setUnlockReview] = useState('')
  const [unlockLiked, setUnlockLiked] = useState(false)

  // State: Mobile CTA Visibility
  const [isCtaVisible, setIsCtaVisible] = useState(true)

  // State: Engine View Modal
  const [isEngineViewOpen, setIsEngineViewOpen] = useState(false)
  const [engineVideoPreloaded, setEngineVideoPreloaded] = useState(false)

  // State: Bids Modal
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false)

  // Inquiry Drawer (global context) - Disabled - inquiry system not ready
  // const { openDrawer: openInquiryDrawer } = useInquiryDrawer()

  // Get bids data - sorted by date descending (latest first)
  const bids = useMemo(() => {
    const vehicleBids = (vehicle as any)?.bids || []
    return [...vehicleBids].sort((a: any, b: any) => {
      const aTime = a?.bid_time ? new Date(a.bid_time).getTime() : 0
      const bTime = b?.bid_time ? new Date(b.bid_time).getTime() : 0

      // Newest (largest timestamp) should appear first; items without time go last
      if (!aTime && !bTime) return 0
      if (!aTime) return 1
      if (!bTime) return -1
      return bTime - aTime
    })
  }, [vehicle])

  const lastBid = bids[0] || null
  const lastBidAmount = lastBid?.bid ?? 0
  const lastBidDate = useMemo(() => {
    if (!lastBid?.bid_time) return null
    return formatDateTime(lastBid.bid_time, i18n.language)
  }, [i18n.language, lastBid?.bid_time])


  // Preload engine video in background after page loads
  useEffect(() => {
    const engineViewUrl = (vehicle as any)?.engine_view
    if (!engineViewUrl || engineVideoPreloaded) return

    // Wait for page to be fully loaded, then start preloading video
    const timeoutId = setTimeout(() => {
      const video = document.createElement('video')
      video.preload = 'auto'
      video.src = engineViewUrl
      video.load()
      setEngineVideoPreloaded(true)
    }, 2000) // 2 second delay after component mounts

    return () => clearTimeout(timeoutId)
  }, [vehicle, engineVideoPreloaded])

  useEffect(() => {
    let lastScrollY = window.scrollY || 0
    const handleScroll = () => {
      const currentY = window.scrollY || 0
      const delta = currentY - lastScrollY

      if (Math.abs(delta) < 10) return

      if (currentY > 100 && delta > 0) {
        setIsCtaVisible(false)
      } else if (delta < 0) {
        setIsCtaVisible(true)
      }
      lastScrollY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Constants
  const FREE_LIMIT = 3
  const PREMIUM_LIMIT = 5

  const bestQuote = useMemo(() => {
    if (!quotes.length) return null
    return [...quotes].sort((a, b) => (Number(a.total_price) || 0) - (Number(b.total_price) || 0))[0]
  }, [quotes])

  // Stable handlers for VehicleQuotesContainer (prevent re-renders)
  const handleOpenBreakdown = useCallback((quote: VehicleQuote) => {
    setActiveBreakdownQuote(quote)
  }, [])

  const handleOpenLeadModal = useCallback(() => {
    setIsLeadModalOpen(true)
  }, [])

  // Toggle Logic for company selection (used by lead modal)
  const handleToggleSelection = (companyId: number) => {
    setSelectedCompanyIds(prev => {
      const isSelected = prev.includes(companyId)
      if (isSelected) {
        return prev.filter(cid => cid !== companyId)
      }

      // Limit Check
      const limit = hasUnlockedExtra ? PREMIUM_LIMIT : FREE_LIMIT
      if (prev.length >= limit) {
        if (!hasUnlockedExtra) {
          setIsUnlockModalOpen(true)
        } else {
          alert(`You can only select up to ${limit} companies.`)
        }
        return prev
      }

      return [...prev, companyId]
    })
  }

  // Suppress unused variable warnings - kept for potential future use
  void handleToggleSelection

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (unlockLiked) {
      setHasUnlockedExtra(true)
      setIsUnlockModalOpen(false)
      alert("Feature Unlocked! You can now select up to 5 companies.")
    }
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCompanyIds.length === 0 || !id) return

    setIsSubmitting(true)
    try {
      // Lead feature removed - show message
      alert('This feature has been removed. Please contact companies directly.')
      setIsLeadModalOpen(false)
      if (!isMultiSelectMode) setSelectedCompanyIds([])
    } catch (err) {
      console.error(err)
      alert("Failed to send request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate prices safely handling nulls
  const auctionPrice = Number(vehicle?.buy_it_now_price || vehicle?.final_bid || 0)
  const shippingPrice = bestQuote ? (Number(bestQuote.breakdown?.shipping_total) || 1200) : 0
  const customsPrice = bestQuote ? (Number(bestQuote.breakdown?.customs_fee) || 500) : 0
  const brokerFee = bestQuote ? (Number(bestQuote.breakdown?.broker_fee) || 300) : 300
  const baseTotalPrice = bestQuote ? (Number(bestQuote.total_price)) : (auctionPrice + shippingPrice + customsPrice + brokerFee)

  // Allow user to adjust auction price locally for approximate calculations
  const [manualAuctionPrice, _setManualAuctionPrice] = useState<number | null>(null)
  const effectiveAuctionPrice = Number.isFinite(manualAuctionPrice as number) && (manualAuctionPrice as number) >= 0
    ? (manualAuctionPrice as number)
    : auctionPrice
  const totalPrice = Math.max(0, baseTotalPrice + (effectiveAuctionPrice - auctionPrice))

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="container p-8 text-center">{t('vehicle.not_found')}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Container matches header: lg:max-w-[1440px] */}
      <div className="vehicle-details-container w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto py-8 lg:py-10">
        {/* Title Header with Back to Results and Location */}
        <VehicleHeaderBar
          year={vehicle.year}
          make={vehicle.make}
          model={vehicle.model}
        />

        {/* Mobile overflow fix: min-w-0 allows grid to shrink below content width */}
        <motion.div
          className="vehicle-main-grid grid md:grid-cols-2 lg:grid-cols-12 gap-5 xl:gap-6 items-start min-h-[60vh] lg:min_h-[70vh] pb-6 min-w-0"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Left Column - Gallery */}
          {/* Mobile: full width, Tablet (md): 1 of 2 cols, Desktop (lg): col-span-4 */}
          <div className="md:col-span-1 lg:col-span-4 space-y-4 w-full min-w-0">
            <CopartGallery photos={photos} />

            {/* 360 View Buttons */}
            {((vehicle as any).iaai_360_view || (vehicle as any).copart_360_interior_view) && (
              <div className="flex gap-2">
                {(vehicle as any).iaai_360_view && (
                  <a
                    href={(vehicle as any).iaai_360_view}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Icon icon="mdi:rotate-3d-variant" className="w-5 h-5 text-primary" />
                    <span className="text-[12px] font-medium text-slate-700">360° Exterior</span>
                  </a>
                )}
                {(vehicle as any).copart_360_interior_view && (
                  <a
                    href={(vehicle as any).copart_360_interior_view}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Icon icon="mdi:car-seat" className="w-5 h-5 text-primary" />
                    <span className="text-[12px] font-medium text-slate-700">360° Interior</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Middle Column - Vehicle Details */}
          {/* Mobile: full width, Tablet (md): 1 of 2 cols, Desktop (lg): col-span-4 */}
          <div className="md:col-span-1 lg:col-span-4 space-y-5 w-full min-w-0">
            {/* Vehicle Details Section */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <h2 className="text-[13px] font-semibold text-slate-900">{t('vehicle.details.title', 'Vehicle details')}</h2>
              </div>

              {/* Details Rows */}
              <div className="divide-y divide-slate-100">
                {/* Lot number */}
                {/* Mobile overflow fix: 90px label column on mobile, 130px on md+ */}
                {vehicle.source_lot_id && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.lot_number', 'Lot number:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-all">{vehicle.source_lot_id}</span>
                  </div>
                )}

                {/* VIN */}
                {/* Mobile overflow fix: 90px label column on mobile, 130px on md+, break-all for long VINs */}
                {vehicle.vin && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.vin', 'VIN:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-all">{vehicle.vin}</span>
                  </div>
                )}

                {/* Title code */}
                {(vehicle as any).document && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.title_code', 'Title code:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-words">{(vehicle as any).document}</span>
                  </div>
                )}

                {/* Odometer - always show, display 0 if falsy */}
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                  <span className="text-[11px] text-slate-500">{t('vehicle.details.odometer', 'Odometer:')}</span>
                  <span className="text-[11px] font-medium text-slate-900 uppercase truncate">{(vehicle.mileage || 0).toLocaleString()} MI</span>
                </div>

                {/* Primary damage */}
                {vehicle.damage_main_damages && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.primary_damage', 'Primary damage:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-words">{vehicle.damage_main_damages}</span>
                  </div>
                )}

                {/* Estimated retail value */}
                {(vehicle as any).retail_value && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.estimated_retail_value', 'Estimated retail value:')}</span>
                    <span className="text-[11px] font-medium text-slate-900">${Number((vehicle as any).retail_value).toLocaleString()}</span>
                  </div>
                )}

                {/* Cylinders - always show, display 0 if falsy */}
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                  <span className="text-[11px] text-slate-500">{t('vehicle.details.cylinders', 'Cylinders:')}</span>
                  <span className="text-[11px] font-medium text-slate-900 uppercase">{vehicle.cylinders || 0}</span>
                </div>

                {/* Color */}
                {vehicle.color && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.color', 'Color:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-words">{vehicle.color}</span>
                  </div>
                )}

                {/* Engine type */}
                {(vehicle.engine_volume || vehicle.cylinders) && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.engine_type', 'Engine type:')}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-medium text-slate-900 uppercase truncate">
                        {vehicle.engine_volume && vehicle.cylinders
                          ? `${vehicle.engine_volume}L ${vehicle.cylinders}`
                          : vehicle.engine_volume
                            ? `${vehicle.engine_volume}L`
                            : vehicle.cylinders}
                      </span>
                      {(vehicle as any).engine_view && (
                        <button
                          onClick={() => setIsEngineViewOpen(true)}
                          className="text-[11px] text-primary hover:underline shrink-0"
                        >
                          {t('vehicle.details.view_engine', 'View engine')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Transmission */}
                {vehicle.transmission && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.transmission', 'Transmission:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase break-words">
                      {t(`auction.filters.${vehicle.transmission.toLowerCase().trim()}`, vehicle.transmission)}
                    </span>
                  </div>
                )}

                {/* Drive */}
                {(vehicle as any).drive && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.drive', 'Drive:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase">{(vehicle as any).drive}</span>
                  </div>
                )}

                {/* Vehicle type */}
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                  <span className="text-[11px] text-slate-500">{t('vehicle.details.vehicle_type', 'Vehicle type:')}</span>
                  <span className="text-[11px] font-medium text-slate-900 uppercase">{t('vehicle.details.vehicle_type_value', 'HARDCODED')}</span>
                </div>

                {/* Fuel */}
                {(vehicle as any).engine_fuel && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.fuel', 'Fuel:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 uppercase">
                      {t(`auction.filters.${(vehicle as any).engine_fuel.toLowerCase().trim()}`, (vehicle as any).engine_fuel as string)}
                    </span>
                  </div>
                )}

                {/* Keys - always show Yes/No */}
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                  <span className="text-[11px] text-slate-500">{t('vehicle.details.keys', 'Keys:')}</span>
                  <span className="text-[11px] font-medium text-slate-900 uppercase">{(vehicle as any).has_keys ? t('vehicle.details.yes', 'YES') : t('vehicle.details.no', 'NO')}</span>
                </div>

                {/* Highlights - only show if run_and_drive is truthy */}
                {(vehicle as any).run_and_drive && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[130px_1fr] px-4 py-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500">{t('vehicle.details.highlights', 'Highlights:')}</span>
                    <span className="text-[11px] font-medium text-slate-900 truncate">{t('vehicle.details.run_and_drive', 'Run and Drive')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Price & Aggregator */}
          {/* Mobile: full width, Tablet (md): full width (2 cols), Desktop (lg): col-span-4 */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4 w-full min-w-0">
            {/* Watchlist + Last Bid Info Block */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Yard + Watchlist (stacked) */}
                <div className="flex flex-col gap-1">
                  {(vehicle as any)?.yard_name && (
                    <span className="text-[12px] font-semibold text-primary uppercase pb-[5px]">
                      {(vehicle as any).yard_name}
                    </span>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isWatchlistLoading}
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login')
                        return
                      }
                      toggleWatch(vehicle.id)
                    }}
                    className={cn(
                      "flex items-center gap-2 text-[12px] font-semibold border shadow-sm min-w-[100px] justify-center transition-all",
                      isWatched(vehicle.id)
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                    )}
                  >
                    <Icon
                      icon={isWatched(vehicle.id) ? "mdi:heart" : "mdi:heart-outline"}
                      className={cn("w-4 h-4 transition-transform", isWatched(vehicle.id) && "scale-110")}
                    />
                    <span className="truncate">
                      {isWatched(vehicle.id) ? t('vehicle.watchlist.saved', 'Saved') : t('vehicle.watchlist.save', 'Save')}
                    </span>
                  </Button>
                </div>

                {/* Last Bid Info */}
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">{t('vehicle.bids.last_bid', 'Last bid:')}</span>
                    <span className="text-[13px] font-semibold text-slate-900">${lastBidAmount.toLocaleString()}</span>
                  </div>
                  {lastBidDate && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">{t('vehicle.bids.last_bid_date', 'Last bid date:')}</span>
                      <span className="text-[11px] font-medium text-slate-700">{lastBidDate}</span>
                    </div>
                  )}
                  {bids.length > 0 && (
                    <button
                      onClick={() => setIsBidsModalOpen(true)}
                      className="text-[11px] text-primary hover:underline mt-1"
                    >
                      {t('vehicle.bids.view_all', 'View all bids ({{count}})', { count: bids.length })}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <VehicleQuotesContainer
              vehicleId={vehicle?.id || 0}
              auction={vehicle?.source || ''}
              usacity={vehicle?.yard_name || ''}
              vehiclecategory={vehicle?.vehicle_type === 'c' ? 'Bike' : 'Sedan'}
              priceAvailable={priceAvailable}
              priceUnavailableMessage={priceUnavailableMessage}
              onOpenBreakdown={handleOpenBreakdown}
              onOpenLeadModal={handleOpenLeadModal}
            />
          </div>
        </motion.div>

        {/* Similar Vehicles - Full Width Below */}
        <div className="mt-8">
          <SimilarVehicles baseVehicleId={vehicle.id} />
        </div>
      </div>
      {/* Success Modal */}
      <SuccessModal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} count={selectedCompanyIds.length || 1} />

      {/* Engine View Modal */}
      {(vehicle as any).engine_view && (
        <Dialog open={isEngineViewOpen} onOpenChange={setIsEngineViewOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Engine View</DialogTitle>
              <DialogDescription>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <video
                src={(vehicle as any).engine_view}
                controls
                autoPlay
                preload="auto"
                playsInline
                className="w-full rounded-lg bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bids History Modal */}
      <Dialog open={isBidsModalOpen} onOpenChange={setIsBidsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('vehicle.bid_history.title', 'Bid History')}</DialogTitle>
            <DialogDescription>
              {vehicle.year} {vehicle.make} {vehicle.model} • {t('vehicle.bid_history.bids_count', '{{count}} bid', { count: bids.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {bids.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                {t('vehicle.bid_history.no_bids', 'No bids recorded for this vehicle')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bids.map((bid: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-3 px-1">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold",
                        index === 0
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {`#${index + 1}`}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900">
                          ${(bid.bid ?? 0).toLocaleString()}
                        </div>
                        {index === 0 && (
                          <span className="text-[10px] text-green-600 font-medium uppercase">{t('vehicle.bid_history.latest_bid', 'Latest Bid')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {bid.bid_time ? (
                        <>
                          <div className="text-[11px] text-slate-700">
                            {formatDateTime(bid.bid_time, i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatDateTime(bid.bid_time, i18n.language, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">{t('vehicle.bid_history.no_date', 'No date')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBidsModalOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky CTA */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-area-bottom transition-transform duration-300",
        isCtaVisible ? "translate-y-0" : "translate-y-full",
        !isCtaVisible && "hidden"
      )}>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('vehicle.mobile_cta.total_est')}</p>
          <p className="text-xl font-extrabold text-primary leading-none">${totalPrice.toLocaleString()}</p>
        </div>
        <Button
          onClick={() => {
            if (selectedCompanyIds.length > 0) setIsLeadModalOpen(true)
            else document.getElementById('quotes-table')?.scrollIntoView({ behavior: 'smooth' })
          }}
          size="lg"
          className="shadow-lg font-bold px-6"
        >
          {selectedCompanyIds.length > 0 ? t('vehicle.mobile_cta.request', { count: selectedCompanyIds.length }) : t('vehicle.mobile_cta.select')}
        </Button>
      </div>

      {/* Lead Modal - Premium Design */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          {/* Icon Badge */}
          <div className="flex justify-center -mt-2 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center shadow-sm">
              <Icon icon="mdi:car-connected" className="h-7 w-7 text-primary" />
            </div>
          </div>

          <DialogHeader>
            <DialogTitle className="text-center">{t('vehicle.lead_modal.title')}</DialogTitle>
            <DialogDescription className="text-center">
              <span dangerouslySetInnerHTML={{ __html: t('vehicle.lead_modal.description', { count: selectedCompanyIds.length }) }} />
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLead} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('vehicle.lead_modal.your_name')}
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('vehicle.lead_modal.phone')}
              </Label>
              <Input
                id="phone"
                placeholder="+995 555 00 00 00"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Contact Method - Modern Toggle Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('vehicle.lead_modal.contact_method')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setContactMethod('whatsapp')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    contactMethod === 'whatsapp'
                      ? "border-green-500 bg-green-50 shadow-sm shadow-green-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                    contactMethod === 'whatsapp' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <Icon icon="mdi:whatsapp" className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-sm font-semibold transition-colors",
                    contactMethod === 'whatsapp' ? "text-green-700" : "text-slate-600"
                  )}>
                    {t('vehicle.lead_modal.whatsapp')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setContactMethod('phone')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    contactMethod === 'phone'
                      ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                    contactMethod === 'phone' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <Icon icon="mdi:phone" className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-sm font-semibold transition-colors",
                    contactMethod === 'phone' ? "text-blue-700" : "text-slate-600"
                  )}>
                    {t('vehicle.lead_modal.phone_call')}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
                  {t('vehicle.lead_modal.sending')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Icon icon="mdi:send" className="h-5 w-5" />
                  {t('vehicle.lead_modal.send_request', { count: selectedCompanyIds.length })}
                </span>
              )}
            </Button>

            {/* Trust Badge */}
            <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Icon icon="mdi:shield-check" className="h-3.5 w-3.5 text-emerald-500" />
              {t('vehicle.lead_modal.secure_note', { defaultValue: 'Your data is secure and will only be shared with selected companies' })}
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Breakdown Modal */}
      <QuoteBreakdownModal
        quote={activeBreakdownQuote}
        isOpen={!!activeBreakdownQuote}
        onClose={() => setActiveBreakdownQuote(null)}
      />

      {/* Unlock Modal */}
      <Dialog open={isUnlockModalOpen} onOpenChange={setIsUnlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:lock-open-variant" className="text-primary" />
              {t('vehicle.unlock_modal.title')}
            </DialogTitle>
            <DialogDescription>
              {t('vehicle.unlock_modal.description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnlockSubmit} className="space-y-4 py-2">
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('vehicle.unlock_modal.like_project')}</span>
                <div className="flex items-center gap-2">
                  <Checkbox id="like" checked={unlockLiked} onCheckedChange={(c) => setUnlockLiked(c === true)} />
                  <Label htmlFor="like" className="text-xs">{t('vehicle.unlock_modal.i_liked')}</Label>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">{t('vehicle.unlock_modal.write_review')}</span>
                <Textarea
                  placeholder={t('vehicle.unlock_modal.review_placeholder')}
                  value={unlockReview}
                  onChange={(e) => setUnlockReview(e.target.value)}
                  className="h-20 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!unlockLiked} className="w-full">{t('vehicle.unlock_modal.unlock_btn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inquiry Drawer is now rendered globally via InquiryDrawerProvider */}

    </div>
  )
}

export default VehicleDetailsPage
