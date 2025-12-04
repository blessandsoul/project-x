import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
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
import { cn } from '@/lib/utils'
import type { VehicleQuote, VehicleSearchItem } from '@/types/vehicles'
import { createLeadFromQuotes } from '@/api/leads'
import { fetchSimilarVehicles } from '@/api/vehicles'
import { AuctionVehicleCard } from '@/components/auction/AuctionVehicleCard'
import VehicleHeaderBar from '@/components/vehicle/VehicleHeaderBar'
import VehicleQuotesSection from '@/components/vehicle/VehicleQuotesSection'

// --- Sub-components ---

const SuccessModal = ({ isOpen, onClose, count }: { isOpen: boolean; onClose: () => void; count: number }) => {
    const { t } = useTranslation()
    
    useEffect(() => {
        if (isOpen) {
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

            const interval: any = setInterval(function() {
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
            <DialogContent className="sm:max-w-md text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <Icon icon="mdi:check-bold" className="h-8 w-8" />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">{t('vehicle.success_modal.title')}</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {t('vehicle.success_modal.description', { count })}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        {t('vehicle.success_modal.manager_contact')}
                    </p>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={onClose} className="w-full sm:w-auto min-w-[150px] font-bold bg-emerald-600 hover:bg-emerald-700">
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
    
    const damagePrimary = vehicle?.damage_main_damages || "Front End"
    const damageSecondary = vehicle?.damage_secondary_damages || "Minor Dents/Scratches"
    const hasKeys = vehicle?.has_keys || vehicle?.has_keys_readable === 'YES'
    const runAndDrive = vehicle?.run_and_drive || "Run & Drive"
    const estValue = Number(vehicle?.est_retail_value) || 12500
    
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
                                $800 - $1.2k
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
                            className="w-full bg-[#1877F2] hover:bg-[#1864D9] text-white h-8 sm:h-9 text-[10px] sm:text-xs font-medium gap-2"
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
    const fmt = (val: number | undefined | null) => val ? `$${Number(val).toLocaleString()}` : '$0'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon icon="mdi:calculator" className="text-primary h-5 w-5" />
                        {t('vehicle.price_breakdown')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('vehicle.detailed_quote')} <span className="font-semibold text-foreground">{quote.company_name}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">{t('vehicle.auction_price')}</span>
                            <span className="font-medium">{fmt(quote.breakdown?.base_price)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Icon icon="mdi:truck-delivery" className="h-3 w-3" />
                                {t('vehicle.shipping_total')}
                            </span>
                            <span className="font-medium">{fmt(quote.breakdown?.shipping_total)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Icon icon="mdi:police-badge" className="h-3 w-3" />
                                {t('vehicle.customs_clearance')}
                            </span>
                            <span className="font-medium">{fmt(quote.breakdown?.customs_fee)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed">
                            <span className="text-muted-foreground">{t('vehicle.broker_fees')}</span>
                            <span className="font-medium">{fmt(quote.breakdown?.broker_fee)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed text-xs text-muted-foreground">
                            <span>{t('vehicle.insurance_optional')}</span>
                            <span>{fmt(quote.breakdown?.insurance_fee)}</span>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-3 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-primary uppercase text-xs tracking-wider">{t('vehicle.total_estimated')}</span>
                        <span className="font-bold text-xl text-foreground">{fmt(quote.total_price)}</span>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground text-center">
                        {t('vehicle.price_note')}
                    </p>
                </div>
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
        
        {/* Watchlist button */}
        <button className="absolute top-3 right-3 bg-background/95 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 hover:bg-muted/80 shadow-sm">
          <Icon icon="mdi:heart-outline" className="w-4 h-4" />
          Watchlist
        </button>

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

        {/* Play button in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 bg-background/70 rounded-full flex items-center justify-center shadow-sm">
            <Icon icon="mdi:play" className="w-7 h-7 text-foreground ml-1" />
          </div>
        </div>

        {/* View damage button */}
        <button className="absolute bottom-3 left-3 bg-background text-foreground rounded-full px-3 py-1.5 text-[11px] font-medium hover:bg-muted/90 border border-border/60 shadow-sm">
          View damage
        </button>

        {/* Photo counter */}
        <div className="absolute bottom-3 right-3 bg-background text-foreground text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5 border border-border/60 shadow-sm">
          <Icon icon="mdi:camera" className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="tabular-nums">{activeIndex + 1}/{photos.length}</span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-7 gap-1.5">
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
            {idx === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Icon icon="mdi:play" className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Copart-style Vehicle Info - exactly like screenshot
const CopartVehicleInfo = ({ vehicle }: { vehicle: any }) => {
  const hasKeys = vehicle?.has_keys || vehicle?.has_keys_readable === 'YES'

  return (
    <div className="space-y-6">
      {/* Highlights Icons Section */}
      <div className="bg-white p-4 rounded border border-slate-200 space-y-4">
        <div className="grid gap-4">
          {/* Engine Starts */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-50 rounded">
              <Icon icon="mdi:engine" className="w-5 h-5 text-[#0047AB]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Engine Starts</div>
              <div className="text-[11px] text-slate-500">Copart verified that the engine starts.</div>
            </div>
          </div>

          {/* Transmission */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-50 rounded">
              <Icon icon="mdi:car-shift-pattern" className="w-5 h-5 text-[#0047AB]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Transmission Engages</div>
              <div className="text-[11px] text-slate-500">Copart verified that the transmission engages.</div>
            </div>
          </div>

          {/* Drives */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-50 rounded">
              <Icon icon="mdi:speedometer" className="w-5 h-5 text-[#0047AB]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Drives over 30mph</div>
              <div className="text-[11px] text-slate-500">This vehicle has been test driven at over 30mph.</div>
            </div>
          </div>

          {/* Keys */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-50 rounded">
              <Icon icon={hasKeys ? "mdi:key-variant" : "mdi:key-variant-off"} className="w-5 h-5 text-[#0047AB]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Has Key</div>
              <div className="text-[11px] text-slate-500">
                {hasKeys ? 'There is 1 key available for this lot.' : 'No keys available for this lot.'}
              </div>
            </div>
          </div>

          {/* AutoCheck */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-50 rounded">
              <Icon icon="mdi:shield-check" className="w-5 h-5 text-[#0047AB]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">AutoCheck vehicle history</div>
              <div className="text-[11px] text-slate-500">Get a full AutoCheck report now.</div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <button className="text-[#0047AB] text-[11px] hover:underline">Order condition report</button>
        </div>
      </div>

      {/* Details List - Clean layout like screenshot */}
      <div className="bg-white p-4 rounded border border-slate-200">
        <div className="space-y-3 text-[12px]">
          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Title code:</span>
            <span className="text-slate-700">{vehicle.sale_title_type || 'Certificate Of Title'}</span>
          </div>
          
          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Odometer:</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-700">{vehicle.mileage?.toLocaleString() || '0'} mi</span>
              <span className="text-slate-500 italic">(Actual)</span>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Primary damage:</span>
            <span className="text-slate-700">{vehicle.damage_main_damages || 'Normal Wear'}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Estimated retail value:</span>
            <span className="text-slate-700">${Number(vehicle.est_retail_value || vehicle.retail_value || 0).toLocaleString()} USD</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Cylinders:</span>
            <span className="text-slate-700">{vehicle.cylinders || '4'}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Color:</span>
            <span className="text-slate-700 capitalize">{vehicle.color || 'Unknown'}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Has Key:</span>
            <span className="text-slate-700">{hasKeys ? 'Yes' : 'No'}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Engine type:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-700">{vehicle.engine_volume ? `${vehicle.engine_volume}L` : ''} {vehicle.cylinders ? `V${vehicle.cylinders}` : ''}</span>
              <button className="flex items-center gap-1 text-[#0047AB] hover:underline">
                <Icon icon="mdi:volume-high" className="w-3.5 h-3.5" />
                Listen to engine
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-baseline">
            <span className="font-bold text-slate-900">Transmission:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-700">{vehicle.transmission || 'Automatic'}</span>
            </div>
          </div>
          
          <div className="pt-2">
             <button className="flex items-center gap-1 text-[#0047AB] hover:underline">
                <Icon icon="mdi:car-lift" className="w-3.5 h-3.5" />
                View undercarriage
              </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// VehicleGallery component kept for potential future use - now using CopartGallery

// VehicleSpecs component kept for potential future use - now using CopartVehicleInfo
// QuoteRow component kept for potential future use - now using inline company cards

const SimilarVehicles = ({ baseVehicleId }: { baseVehicleId: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [similarItems, setSimilarItems] = useState<VehicleSearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()
  
  // Desktop Slider State
  const [currentIndex, setCurrentIndex] = useState(0)
  const ITEMS_PER_VIEW_DESKTOP = 3

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchSimilarVehicles(baseVehicleId, { limit: 20 })
        if (!isMounted) return
        const items = Array.isArray(response.items) ? response.items : []
        setSimilarItems(items)
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

  // Autoplay for Desktop
  useEffect(() => {
    if (similarItems.length <= ITEMS_PER_VIEW_DESKTOP) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => 
        prev + ITEMS_PER_VIEW_DESKTOP >= similarItems.length ? 0 : prev + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [similarItems.length])

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

  // Desktop Navigation Handlers
  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => 
        prev + ITEMS_PER_VIEW_DESKTOP >= similarItems.length ? 0 : prev + 1
    )
  }

  return (
    <motion.section
      className="space-y-4 pt-8 border-t overflow-hidden"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
        
        {/* Desktop Controls */}
        {similarItems.length > ITEMS_PER_VIEW_DESKTOP && (
          <div className="hidden md:flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev} disabled={currentIndex === 0}>
                  <Icon icon="mdi:chevron-left" className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext} disabled={currentIndex + ITEMS_PER_VIEW_DESKTOP >= similarItems.length}>
                  <Icon icon="mdi:chevron-right" className="h-4 w-4" />
              </Button>
          </div>
        )}
      </div>

      {/* Mobile Slider (Snap Scroll) */}
      <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
        {similarItems.map((item) => (
          <div key={item.id} className="min-w-[85vw] snap-center">
            <AuctionVehicleCard
                item={item}
                priority={false}
                onCalculate={() => navigate({ pathname: `/vehicle/${item.id}` })}
                onViewDetails={() => navigate({ pathname: `/vehicle/${item.id}` })}
            />
          </div>
        ))}
      </div>

      {/* Desktop Slider (Transform) */}
      <div className="hidden md:block relative overflow-hidden">
        <div 
            className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${currentIndex} * (33.333% + 5.33px)))` }}
        >
            {similarItems.map((item) => (
                <div key={item.id} className="w-[calc((100%-32px)/3)] flex-shrink-0">
                    <AuctionVehicleCard
                        item={item}
                        priority={false}
                        onCalculate={() => navigate({ pathname: `/vehicle/${item.id}` })}
                        onViewDetails={() => navigate({ pathname: `/vehicle/${item.id}` })}
                    />
                </div>
            ))}
        </div>
      </div>
    </motion.section>
  )
}

// --- Main Page Component ---

const VehicleDetailsPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  // Parse URL params for initial values - use ref to only read once on mount
  const initialParamsRef = useRef<{ limit: number; rating: number | null } | null>(null)
  if (initialParamsRef.current === null) {
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
    isLoadingMore: _isLoadingMore,
    isRefreshingQuotes: _isRefreshingQuotes,
    hasMoreQuotes: _hasMoreQuotes,
    loadMoreQuotes: _loadMoreQuotes,
    quotesLimit: _quotesLimit,
    setQuotesLimit: setQuotesLimitInternal,
    minRating,
    setMinRating: setMinRatingInternal,
    quotesTotal: _quotesTotal,
    error,
  } = useVehicleDetails(id ? Number(id) : null, {
    initialLimit: initialParamsRef.current.limit,
    initialMinRating: initialParamsRef.current.rating,
  })

  // Sync quotesLimit/minRating with URL could be added later if needed

  // State: Selection & Unlock
  const [isMultiSelectMode, _setIsMultiSelectMode] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [isCompareMode, setIsCompareMode] = useState(false)
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

  // Derived: Filtered Quotes (client-side filters only - rating is now server-side)
  const filteredQuotes = useMemo(() => {
    let result = [...quotes]
    
    if (filterVip) {
        result = result.filter((_, idx) => idx < 3)
    }

    if (filterFast) {
        result = result.filter(q => (q.delivery_time_days || 60) < 45)
    }

    return result
  }, [quotes, filterVip, filterFast])
  
  // Derived: Is rating filter active
  const isHighRatingOnly = minRating !== null && minRating >= 4.5

  const bestQuote = useMemo(() => {
    if (!quotes.length) return null
    return [...quotes].sort((a, b) => (Number(a.total_price) || 0) - (Number(b.total_price) || 0))[0]
  }, [quotes])

  // Price Stats for Coloring
  const priceStats = useMemo(() => {
    if (!quotes.length) return { min: 0, max: 0, avg: 0 }
    const prices = quotes.map(q => Number(q.total_price) || 0).filter(p => p > 0)
    if (!prices.length) return { min: 0, max: 0, avg: 0 }
    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length
    }
  }, [quotes])

  void priceStats // Used for potential future price coloring

  // Toggle Logic
  const handleToggleSelection = (companyId: number) => {
    setSelectedCompanyIds(prev => {
      const isSelected = prev.includes(companyId)
      if (isSelected) {
        return prev.filter(id => id !== companyId)
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
       await createLeadFromQuotes({
         vehicleId: Number(id),
         selectedCompanyIds,
         name: formName,
         contact: formPhone,
         message: `Interested in this vehicle. Please contact me via ${contactMethod}.`,
         priority: 'price',
         preferredContactChannel: contactMethod as any
       })
       setIsLeadModalOpen(false)
       if (!isMultiSelectMode) setSelectedCompanyIds([])
       alert(`Request sent successfully to ${selectedCompanyIds.length} companies!`)
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
        {/* Copart-style Header Bar */}
        <div className="bg-[#1a2b4c] text-white py-3 px-8">
          <div className="container mx-auto">
            <nav className="flex items-center text-xs text-white/70 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="h-6 px-0 text-xs text-white/70 hover:text-white transition-colors"
              >
                Home
              </Button>
              <Icon icon="mdi:chevron-right" className="h-3 w-3" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auction-listings')}
                className="h-6 px-0 text-xs text-white/70 hover:text-white transition-colors"
              >
                Vehicle Finder
              </Button>
              <Icon icon="mdi:chevron-right" className="h-3 w-3" />
              <span className="text-white">{vehicle.year} {vehicle.make} {vehicle.model}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-8 py-8 lg:py-10">
          {/* Title Header with Back to Results and Location */}
          <VehicleHeaderBar
            year={vehicle.year}
            make={vehicle.make}
            model={vehicle.model}
            lotId={vehicle.source_lot_id || vehicle.id}
            vin={vehicle.vin}
            locationCity={(vehicle as any).location_city}
            locationState={(vehicle as any).location_state}
            locationName={(vehicle as any).location_name}
          />

          <motion.div
            className="grid lg:grid-cols-12 gap-5 xl:gap-6 items-start min-h-[60vh] lg:min_h-[70vh] pb-6"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Left Column - Gallery + quick condition */}
            <div className="lg:col-span-4 space-y-4">
              <CopartGallery photos={photos} />
              
              {/* Exterior Condition Section */}
              <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3 text-[13px] tracking-tight flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">EX</span>
                  <span>Exterior condition</span>
                </h3>
                <div className="space-y-3 text-[12px] text-muted-foreground">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Primary damage</span>
                        <span className="text-foreground/80 text-right truncate max-w-[8rem]">{vehicle.damage_main_damages || 'Normal Wear'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Secondary damage</span>
                        <span className="text-foreground/80 text-right truncate max-w-[8rem]">{vehicle.damage_secondary_damages || 'None'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Body style</span>
                        <span className="text-foreground/80 text-right truncate max-w-[8rem]">{(vehicle as any).body_type || 'Sedan'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Color</span>
                        <span className="text-foreground/80 capitalize text-right truncate max-w-[8rem]">{vehicle.color || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Doors</span>
                        <span className="text-foreground/80">{(vehicle as any).doors || '4'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Interior color</span>
                        <span className="text-foreground/80 capitalize text-right truncate max-w-[8rem]">{(vehicle as any).interior_color || 'Black'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Damage Details Section */}
                  <div className="pt-3 border-t border-border/60">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon icon="mdi:alert-outline" className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-[11px] text-foreground uppercase tracking-wide">Damage summary</span>
                    </div>
                    <div className="bg-muted rounded-xl p-3 space-y-2 text-[11px]">
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:alert" className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">Front End Damage</div>
                          <div className="text-muted-foreground mt-1">
                            Bumper, hood, and front fender show significant impact damage. Headlights and grille need replacement.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:car-door" className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">Side Damage</div>
                          <div className="text-muted-foreground mt-1">
                            Driver side door has minor scratches and dent. Passenger side appears clean.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:shield-check" className="w-4 h-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">Structural</div>
                          <div className="text-muted-foreground mt-1">
                            Frame appears straight. No visible structural damage detected.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button className="flex items-center gap-1 text-primary hover:underline text-[11px]">
                      <Icon icon="mdi:image-search" className="w-3.5 h-3.5" />
                      View all exterior photos
                    </button>
                    <span className="text-[10px] text-muted-foreground">Visual inspection only, not a full report.</span>
                  </div>
                </div>
              </div>

              {/* Full Vehicle Details Section */}
              <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3 text-[13px] tracking-tight flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">ID</span>
                  <span>Full vehicle details</span>
                </h3>
                <div className="space-y-3 text-[12px] text-muted-foreground">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">VIN</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{vehicle.vin}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Year</span>
                        <span className="text-foreground/80">{vehicle.year}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Make</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{vehicle.make}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Model</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{vehicle.model}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Trim</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{(vehicle as any).trim || 'Base'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Fuel type</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{(vehicle as any).fuel_type || 'Gasoline'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Engine</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{vehicle.engine_volume ? `${vehicle.engine_volume}L` : ''} {vehicle.cylinders ? `V${vehicle.cylinders}` : ''}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Transmission</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{vehicle.transmission || 'Automatic'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Drive type</span>
                        <span className="text-foreground/80 text-right truncate max-w-[9rem]">{(vehicle as any).drive_type || 'FWD'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">Cylinders</span>
                        <span className="text-foreground/80">{vehicle.cylinders || '4'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button className="flex items-center gap-1 text-primary hover:underline text-[11px]">
                      <Icon icon="mdi:file-document" className="w-3.5 h-3.5" />
                      Download full specification sheet
                    </button>
                    <span className="text-[10px] text-muted-foreground">PDF summary for offline review.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Vehicle Details */}
            <div className="lg:col-span-4 space-y-5">
              <CopartVehicleInfo vehicle={vehicle} />
            </div>

            {/* Right Column - Price & Aggregator */}
            <div className="lg:col-span-4 space-y-7">
              <VehicleQuotesSection
                quotes={quotes}
                filteredQuotes={filteredQuotes}
                priceStats={priceStats}
                selectedCompanyIds={selectedCompanyIds}
                isCompareMode={isCompareMode}
                quotesLimit={_quotesLimit}
                totalQuotes={_quotesTotal}
                isHighRatingOnly={isHighRatingOnly}
                error={error}
                onToggleHighRating={() => setMinRatingInternal(isHighRatingOnly ? null : 4.5)}
                onChangeLimit={(limit) => setQuotesLimitInternal(limit)}
                onToggleCompareMode={() => setIsCompareMode((prev) => !prev)}
                onToggleSelection={handleToggleSelection}
                onOpenBreakdown={(quote) => setActiveBreakdownQuote(quote)}
                onOpenLeadModal={() => setIsLeadModalOpen(true)}
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

      {/* Lead Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('vehicle.lead_modal.title')}</DialogTitle>
            <DialogDescription>
              <span dangerouslySetInnerHTML={{ __html: t('vehicle.lead_modal.description', { count: selectedCompanyIds.length }) }} />
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLead} className="space-y-4 py-2">
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('vehicle.lead_modal.your_name')}</Label>
                    <Input id="name" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">{t('vehicle.lead_modal.phone')}</Label>
                    <Input id="phone" placeholder="+995 555 00 00 00" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                    <Label>{t('vehicle.lead_modal.contact_method')}</Label>
                    <div className="flex gap-4">
                        <div onClick={() => setContactMethod('whatsapp')} className={cn("flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-all", contactMethod === 'whatsapp' ? "border-primary bg-primary/5 ring-1 ring-primary" : "")}>
                            <Icon icon="mdi:whatsapp" className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">{t('vehicle.lead_modal.whatsapp')}</span>
                        </div>
                        <div onClick={() => setContactMethod('phone')} className={cn("flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-all", contactMethod === 'phone' ? "border-primary bg-primary/5 ring-1 ring-primary" : "")}>
                            <Icon icon="mdi:phone" className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">{t('vehicle.lead_modal.phone_call')}</span>
                        </div>
                    </div>
                </div>
             </div>
             <Button type="submit" className="w-full h-11 font-bold mt-2" disabled={isSubmitting}>
               {isSubmitting ? t('vehicle.lead_modal.sending') : t('vehicle.lead_modal.send_request', { count: selectedCompanyIds.length })}
             </Button>
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

    </div>
  )
}

export default VehicleDetailsPage
