import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

// Components
import Header from '@/components/Header/index.tsx'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { VipBadge } from '@/components/company/VipBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { navigationItems, footerLinks } from '@/config/navigation'
import { AuctionVehicleCard } from '@/components/auction/AuctionVehicleCard'

// --- Sub-components ---

const SocialProofWidget = () => {
    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(false)
    
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 3000)
        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-20 left-4 z-40 bg-background/80 backdrop-blur-md border shadow-sm rounded-full py-1.5 px-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-700 hover:shadow-md transition-all">
            <div className="flex -space-x-2">
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="" />
                </div>
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="" />
                </div>
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                    +1
                </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">3 people</span> {t('vehicle.social_proof.people_viewing')}
            </span>
            <button onClick={() => setIsVisible(false)} className="ml-1 text-muted-foreground/50 hover:text-foreground transition-colors">
                <Icon icon="mdi:close" className="h-3 w-3" />
            </button>
        </div>
    )
}

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

const DamageViewer = ({ vehicle }: { vehicle: any }) => {
    const { t } = useTranslation()
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [isLiking, setIsLiking] = useState(false)
    
    const damagePrimary = vehicle?.damage_main_damages || "Front End"
    const damageSecondary = vehicle?.damage_secondary_damages || "Minor Dents/Scratches"
    const hasKeys = vehicle?.has_keys || vehicle?.has_keys_readable === 'YES'
    const runAndDrive = vehicle?.run_and_drive || "Run & Drive"
    const airbags = vehicle?.airbags || "Intact"
    const odoBrand = vehicle?.odometer_brand || "Actual"
    const estValue = Number(vehicle?.est_retail_value) || 12500
    
    const handleUnlock = () => {
        setIsLiking(true)
        // Mock API call / FB popup
        setTimeout(() => {
            setIsLiking(false)
            setIsUnlocked(true)
        }, 1500)
    }

    return (
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
                <h3 className="font-medium text-sm flex items-center gap-2">
                    <Icon icon="mdi:car-info" className="text-muted-foreground" />
                    {t('vehicle.condition_report')}
                </h3>
                <Badge variant="outline" className="font-normal text-[10px] text-muted-foreground">{t('vehicle.ai_analysis')}</Badge>
            </div>
            
            <div className={cn("flex flex-col lg:flex-row gap-8 transition-all duration-500", !isUnlocked && "blur-md opacity-50 select-none pointer-events-none")}>
                {/* Left: Visual + Damage Tags */}
                <div className="flex gap-6 flex-shrink-0">
                    {/* SVG Skeleton */}
                    <div className="relative w-24 h-40 flex-shrink-0 opacity-80">
                        <svg viewBox="0 0 100 200" className="w-full h-full text-muted-foreground/30">
                            <path d="M20,40 Q20,10 50,10 Q80,10 80,40 L80,160 Q80,190 50,190 Q20,190 20,160 Z" fill="none" stroke="currentColor" strokeWidth="4" />
                            <rect x="10" y="45" width="10" height="20" rx="2" fill="currentColor" />
                            <rect x="80" y="45" width="10" height="20" rx="2" fill="currentColor" />
                            <rect x="10" y="135" width="10" height="20" rx="2" fill="currentColor" />
                            <rect x="80" y="135" width="10" height="20" rx="2" fill="currentColor" />
                        </svg>
                        {/* Damage Highlight - Minimalist Dot */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                            </div>
                        </div>
                    </div>

                    {/* Damage Details */}
                    <div className="space-y-3 pt-2">
                        <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t('vehicle.primary_damage')}</span>
                            <div className="text-red-600 font-bold text-sm flex items-center gap-1">
                                <Icon icon="mdi:alert-circle" className="h-3.5 w-3.5" />
                                {damagePrimary}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t('vehicle.secondary_damage')}</span>
                            <div className="text-amber-600 font-medium text-xs flex items-center gap-1">
                                <Icon icon="mdi:alert-outline" className="h-3.5 w-3.5" />
                                {damageSecondary}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: AI Estimate & Tech Specs */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6 border-t lg:border-t-0 lg:border-l border-border/50 pt-6 lg:pt-0 lg:pl-6">
                    {/* Estimate Block */}
                    <div className="space-y-3">
                        <div className="pl-3 border-l-2 border-blue-500/50">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{t('vehicle.ai_repair_estimate')}</div>
                            <div className="text-xl font-bold text-foreground tracking-tight">
                                $800 - $1,200
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Approx. <span className="font-semibold text-foreground">10-15%</span> of retail value
                            </div>
                        </div>
                        <div className="bg-muted/20 rounded p-2.5 flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">{t('vehicle.retail_value')}</span>
                            <span className="text-xs font-bold">${estValue.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {/* Technical Status */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/10 rounded p-2 border border-transparent hover:border-border transition-colors">
                            <div className="text-[10px] text-muted-foreground mb-1">{t('vehicle.engine_status')}</div>
                            <div className="text-xs font-medium flex items-center gap-1.5 text-emerald-600">
                                <Icon icon="mdi:engine" className="h-3.5 w-3.5" />
                                {runAndDrive}
                            </div>
                        </div>
                        <div className="bg-muted/10 rounded p-2 border border-transparent hover:border-border transition-colors">
                            <div className="text-[10px] text-muted-foreground mb-1">{t('vehicle.keys')}</div>
                            <div className={cn("text-xs font-medium flex items-center gap-1.5", hasKeys ? "text-emerald-600" : "text-red-500")}>
                                <Icon icon={hasKeys ? "mdi:key-variant" : "mdi:key-variant-off"} className="h-3.5 w-3.5" />
                                {hasKeys ? t('vehicle.keys_present') : t('vehicle.keys_missing')}
                            </div>
                        </div>
                        <div className="bg-muted/10 rounded p-2 border border-transparent hover:border-border transition-colors">
                            <div className="text-[10px] text-muted-foreground mb-1">{t('vehicle.airbags')}</div>
                            <div className="text-xs font-medium flex items-center gap-1.5">
                                <Icon icon="mdi:airbag" className="h-3.5 w-3.5" />
                                {airbags}
                            </div>
                        </div>
                        <div className="bg-muted/10 rounded p-2 border border-transparent hover:border-border transition-colors">
                            <div className="text-[10px] text-muted-foreground mb-1">{t('vehicle.odometer')}</div>
                            <div className="text-xs font-medium flex items-center gap-1.5">
                                <Icon icon="mdi:counter" className="h-3.5 w-3.5" />
                                {odoBrand}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lock Overlay */}
            {!isUnlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] p-4 text-center">
                    <div className="bg-background/95 p-6 rounded-xl shadow-lg border border-border/50 max-w-xs space-y-4">
                        <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Icon icon="mdi:facebook" className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm">{t('vehicle.unlock_report')}</h4>
                            <p className="text-xs text-muted-foreground">{t('vehicle.unlock_desc')}</p>
                        </div>
                        <Button 
                            onClick={handleUnlock} 
                            className="w-full bg-[#1877F2] hover:bg-[#1864D9] text-white h-9 text-xs font-medium gap-2"
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

const VehicleGallery = ({ photos }: { photos: any[] }) => {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)

  if (!photos.length) {
    return <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">{t('vehicle.no_photos')}</div>
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm group">
        <img
          src={photos[activeIndex].url}
          alt="Vehicle"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-foreground shadow-sm"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            alert("Link copied!")
                        }}
                    >
                        <Icon icon="mdi:share-variant" className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{t('vehicle.share_link')}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        className={cn("h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors", isSaved ? "text-red-500" : "text-foreground")}
                        onClick={() => setIsSaved(!isSaved)}
                    >
                        <Icon icon={isSaved ? "mdi:heart" : "mdi:heart-outline"} className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{isSaved ? t('vehicle.remove_favorites') : t('vehicle.save_vehicle')}</TooltipContent>
            </Tooltip>
        </div>

        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
          {activeIndex + 1} / {photos.length}
        </div>
        
        {/* Navigation Arrows (Desktop) */}
        <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev > 0 ? prev - 1 : photos.length - 1) }}
                className="bg-white/90 p-1.5 rounded-full shadow-md hover:bg-white text-black transition-transform hover:scale-110"
            >
                <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev < photos.length - 1 ? prev + 1 : 0) }}
                className="bg-white/90 p-1.5 rounded-full shadow-md hover:bg-white text-black transition-transform hover:scale-110"
            >
                <Icon icon="mdi:chevron-right" className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Thumbnails Strip */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {photos.map((photo, idx) => (
            <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                "relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 snap-start transition-all",
                activeIndex === idx 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
            >
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
            ))}
        </div>
      </div>
    </div>
  )
}

const VehicleSpecs = ({ vehicle }: { vehicle: any }) => {
  const { t } = useTranslation()
  if (!vehicle) return null

  const specs = [
    { icon: 'mdi:engine', label: t('vehicle.specs.engine'), value: vehicle.engine_volume ? `${vehicle.engine_volume}L` : 'N/A' },
    { icon: 'mdi:car-shift-pattern', label: t('vehicle.specs.transmission'), value: vehicle.transmission || 'Automatic' },
    { icon: 'mdi:car-traction-control', label: t('vehicle.specs.drive'), value: vehicle.drive || 'FWD' },
    { icon: 'mdi:counter', label: t('vehicle.specs.mileage'), value: `${vehicle.mileage?.toLocaleString() || '0'} mi` },
    { icon: 'mdi:calendar', label: t('vehicle.specs.year'), value: vehicle.year },
    { icon: 'mdi:gas-station', label: t('vehicle.specs.fuel'), value: vehicle.engine_fuel || 'Gasoline' },
    { icon: 'mdi:barcode', label: t('vehicle.specs.vin'), value: vehicle.vin, copy: true },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {specs.map((spec, idx) => (
        <div key={idx} className="flex flex-col p-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-xl border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Icon icon={spec.icon} className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{spec.label}</span>
          </div>
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {spec.value}
            {spec.copy && (
              <Tooltip>
                <TooltipTrigger asChild>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(String(spec.value))
                            // Optional: Add toast here
                        }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                    >
                        <Icon icon="mdi:content-copy" className="h-3 w-3" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>{t('vehicle.specs.copy_vin')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const CarfaxWidget = () => {
    const { t } = useTranslation()
    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon icon="mdi:file-document-check" className="h-32 w-32 text-blue-900" />
            </div>

            {/* Fox Image Area */}
            <div className="flex-shrink-0 relative z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full shadow-md border-4 border-white flex items-center justify-center overflow-hidden">
                    <img 
                        src="/images/carfax-fox.png" 
                        alt="Carfax Fox" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                            // Fallback if image not found
                            e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Carfax_logo.svg/320px-Carfax_logo.svg.png"
                        }}
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                    RECOMMENDED
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center sm:text-left z-10 space-y-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                        <Icon icon="mdi:shield-check" className="text-blue-600" />
                        {t('vehicle.carfax.title')}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-md">
                        {t('vehicle.carfax.description')}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <Button className="bg-[#1877F2] hover:bg-[#1465D0] text-white font-semibold h-10 shadow-sm group">
                        <Icon icon="mdi:file-document" className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                        {t('vehicle.carfax.get_report')}
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="line-through decoration-red-400">$39.99</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{t('vehicle.carfax.free_with_order')}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

const QuoteRow = ({ 
    quote, 
    isSelected, 
    onToggle, 
    vipLabel,
    vipVariant,
    priceColor,
    onViewBreakdown,
    isMultiSelectMode
}: { 
    quote: VehicleQuote; 
    isSelected: boolean; 
    onToggle: () => void; 
    vipLabel?: string;
    vipVariant?: 'diamond' | 'gold' | 'silver' | 'default';
    priceColor?: string;
    onViewBreakdown: (e: React.MouseEvent) => void;
    isMultiSelectMode: boolean;
}) => {
  const { t } = useTranslation()
  const totalPrice = Number(quote.total_price) || 0
  const rating = 4.8 // Mock rating
  const reviews = 120 // Mock reviews

  return (
    <TableRow 
        className={cn(
            "group cursor-pointer transition-colors", 
            isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
        )}
        onClick={onToggle}
    >
      {isMultiSelectMode && (
        <TableCell className="w-[50px] pr-0">
            <Checkbox checked={isSelected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
        </TableCell>
      )}
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{quote.company_name}</span>
            {vipLabel && <VipBadge label={vipLabel} variant={vipVariant} />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center text-amber-500">
                <Icon icon="mdi:star" className="h-3 w-3 fill-current" />
                <span className="ml-0.5 font-medium text-foreground">{rating}</span>
            </div>
            <span className="text-muted-foreground/60">•</span>
            <span>{reviews} {t('vehicle.quotes.reviews')}</span>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="ml-1 inline-flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help">
                        <Icon icon="mdi:check-decagram" className="h-3 w-3" />
                        {t('vehicle.quotes.verified')}
                    </span>
                </TooltipTrigger>
                <TooltipContent>{t('vehicle.quotes.verified_importer')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm">
          <span className="font-medium">{quote.delivery_time_days || '45-60'} {t('vehicle.quotes.days')}</span>
          <span className="text-xs text-muted-foreground">{t('vehicle.quotes.sea_land')}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className={cn("font-bold text-lg", priceColor || "text-foreground")}>
            ${totalPrice.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">{t('vehicle.quotes.all_inclusive')}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
         <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1"
                        onClick={onViewBreakdown}
                    >
                        <Icon icon="mdi:calculator" className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('vehicle.quotes.breakdown')}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{t('vehicle.price_breakdown')}</TooltipContent>
            </Tooltip>
            
            {!isMultiSelectMode && (
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggle() // This triggers the lead modal in single select mode
                    }}
                >
                    {t('vehicle.quotes.order')}
                </Button>
            )}
         </div>
      </TableCell>
    </TableRow>
  )
}

const SimilarVehicles = ({ baseVehicleId }: { baseVehicleId: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [similarItems, setSimilarItems] = useState<VehicleSearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchSimilarVehicles(baseVehicleId, { limit: 3 })
        if (!isMounted) return
        const items = Array.isArray(response.items) ? response.items.slice(0, 3) : []
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

  if (isLoading) {
    return (
      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl hidden sm:block" />
          <Skeleton className="h-64 rounded-xl hidden sm:block" />
        </div>
      </div>
    )
  }

  if (error || !similarItems.length) {
    return null
  }

  return (
    <div className="space-y-4 pt-8 border-t">
      <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {similarItems.slice(0, 3).map((item) => (
          <AuctionVehicleCard
            key={item.id}
            item={item}
            priority={false}
            onOpenGallery={() => {
              navigate({ pathname: `/vehicle/${item.id}` })
            }}
            onCalculate={() => {
              navigate({ pathname: `/vehicle/${item.id}` })
            }}
            onViewDetails={() => {
              navigate({ pathname: `/vehicle/${item.id}` })
            }}
          />
        ))}
      </div>
    </div>
  )
}

// --- Main Page Component ---

const VehicleDetailsPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicle, photos, quotes, isLoading } = useVehicleDetails(id ? Number(id) : null)

  // State: Selection & Unlock
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [hasUnlockedExtra, setHasUnlockedExtra] = useState(false)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
  const [activeBreakdownQuote, setActiveBreakdownQuote] = useState<VehicleQuote | null>(null)
  
  // State: Filters
  const [filterVip, setFilterVip] = useState(false)
  const [filterRating, setFilterRating] = useState(false)
  const [filterFast, setFilterFast] = useState(false)

  // State: Lead Modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State: Unlock Form
  const [unlockReview, setUnlockReview] = useState('')
  const [unlockLiked, setUnlockLiked] = useState(false)

  // Constants
  const FREE_LIMIT = 3
  const PREMIUM_LIMIT = 5

  // Derived: Filtered Quotes
  const filteredQuotes = useMemo(() => {
    let result = [...quotes]
    
    if (filterVip) {
        result = result.filter((_, idx) => idx < 3)
    }
    
    if (filterRating) {
        result = result // No real rating data yet
    }

    if (filterFast) {
        result = result.filter(q => (q.delivery_time_days || 60) < 45)
    }

    return result
  }, [quotes, filterVip, filterRating, filterFast])

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

  const getPriceColor = (price: number) => {
    if (price === 0) return 'text-foreground'
    if (price <= priceStats.min * 1.02) return 'text-emerald-600' // Within 2% of min
    if (price >= priceStats.max * 0.98) return 'text-red-600' // Within 2% of max
    return 'text-amber-600'
  }

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

  const handleRowClick = (quote: VehicleQuote) => {
    if (isMultiSelectMode) {
        handleToggleSelection(quote.company_id)
    } else {
        // Single select mode logic - open lead modal directly
        setSelectedCompanyIds([quote.company_id])
        setIsLeadModalOpen(true)
    }
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
  const totalPrice = bestQuote ? (Number(bestQuote.total_price)) : (auctionPrice + shippingPrice + customsPrice + brokerFee)

  if (isLoading) return <div className="min-h-screen"><Header user={null} navigationItems={navigationItems} /><main className="container p-8"><Skeleton className="h-96" /></main></div>
  if (!vehicle) return <div className="min-h-screen"><Header user={null} navigationItems={navigationItems} /><div className="container p-8">{t('vehicle.not_found')}</div></div>

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header user={null} navigationItems={navigationItems} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        {/* Breadcrumbs & Title Section */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-hidden">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors shrink-0">{t('vehicle.breadcrumb_home')}</button>
          <Icon icon="mdi:chevron-right" className="h-4 w-4 mx-1 shrink-0" />
          <button onClick={() => navigate('/catalog')} className="hover:text-primary transition-colors shrink-0">{t('vehicle.breadcrumb_vehicles')}</button>
          <Icon icon="mdi:chevron-right" className="h-4 w-4 mx-1 shrink-0" />
          <span className="text-foreground font-medium truncate">{vehicle.year} {vehicle.make} {vehicle.model}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="outline" className="uppercase tracking-wider text-[10px]">{t('vehicle.lot')}: {vehicle.source_lot_id}</Badge>
                {vehicle.is_new && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 animate-pulse shadow-sm border-none">
                        {t('vehicle.new_arrival')}
                    </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon icon="mdi:map-marker" className="h-4 w-4 text-primary" />
                  {vehicle.city || vehicle.state || 'USA Auction'}
                </span>
                <span className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-clock" className="h-4 w-4" />
                  {t('vehicle.sale_date')}: {vehicle.sold_at_date || t('vehicle.upcoming')}
                </span>
                <AuctionTimer dateStr={vehicle.sold_at_date} />
              </div>
            </div>

            <VehicleGallery photos={photos} />
            
            <DamageViewer vehicle={vehicle} />

            <VehicleSpecs vehicle={vehicle} />

            <CarfaxWidget />

            {/* Transparency Table with Filters */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden" id="quotes-table">
              <div className="p-4 border-b bg-muted/10 space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-900/80 px-3 py-2 rounded-md flex items-center gap-2 text-[11px] font-medium">
                    <Icon icon="mdi:gift-outline" className="h-3.5 w-3.5" />
                    <span dangerouslySetInnerHTML={{ __html: t('vehicle.quotes.promo_text') }} />
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Icon icon="mdi:compare" className="text-primary h-5 w-5" />
                        {isMultiSelectMode ? t('vehicle.quotes.select_companies') : t('vehicle.quotes.title')}
                        </h2>
                        {!isMultiSelectMode && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('vehicle.quotes.click_to_order')}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isMultiSelectMode ? (
                            <Button 
                                size="sm" 
                                onClick={() => setIsMultiSelectMode(true)}
                                className="text-xs"
                            >
                                {t('vehicle.quotes.select_multiple')}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground font-medium">{t('vehicle.quotes.selected')}:</span>
                                <Badge variant={selectedCompanyIds.length > 0 ? "default" : "secondary"}>
                                    {selectedCompanyIds.length} / {hasUnlockedExtra ? PREMIUM_LIMIT : FREE_LIMIT}
                                </Badge>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                        setIsMultiSelectMode(false)
                                        setSelectedCompanyIds([])
                                    }}
                                    className="text-xs h-8 px-2"
                                >
                                    {t('vehicle.quotes.cancel')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button 
                        variant={filterVip ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterVip(!filterVip)}
                        className="h-8 text-xs"
                    >
                        {filterVip ? <Icon icon="mdi:check" className="mr-1 h-3 w-3" /> : null}
                        {t('vehicle.quotes.vip_only')}
                    </Button>
                    <Button 
                        variant={filterRating ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterRating(!filterRating)}
                        className="h-8 text-xs"
                    >
                        {filterRating ? <Icon icon="mdi:check" className="mr-1 h-3 w-3" /> : <Icon icon="mdi:star" className="mr-1 h-3 w-3 text-amber-500" />}
                        {t('vehicle.quotes.rating_filter')}
                    </Button>
                    <Button 
                        variant={filterFast ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterFast(!filterFast)}
                        className="h-8 text-xs"
                    >
                        {filterFast ? <Icon icon="mdi:check" className="mr-1 h-3 w-3" /> : <Icon icon="mdi:lightning-bolt" className="mr-1 h-3 w-3 text-amber-500" />}
                        {t('vehicle.quotes.fast_delivery')}
                    </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        {isMultiSelectMode && <TableHead className="w-[50px]"></TableHead>}
                        <TableHead className="w-[200px]">{t('vehicle.quotes.company')}</TableHead>
                        <TableHead>{t('vehicle.quotes.delivery')}</TableHead>
                        <TableHead className="text-right">{t('vehicle.quotes.total_price')}</TableHead>
                        <TableHead className="text-right w-[100px]">{t('vehicle.quotes.action')}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredQuotes.map((quote) => {
                        // Mock VIP Status logic
                        const originalIndex = quotes.findIndex(q => q.company_id === quote.company_id)
                        let vipLabel: string | undefined
                        let vipVariant: 'diamond' | 'gold' | 'silver' | 'default' = 'default'
                        
                        if (originalIndex === 0) { vipLabel = 'Diamond'; vipVariant = 'diamond' }
                        else if (originalIndex === 1) { vipLabel = 'Gold'; vipVariant = 'gold' }
                        else if (originalIndex === 2) { vipLabel = 'Silver'; vipVariant = 'silver' }

                        const priceColor = getPriceColor(Number(quote.total_price))

                        return (
                            <QuoteRow 
                                key={quote.company_id} 
                                quote={quote} 
                                isSelected={selectedCompanyIds.includes(quote.company_id)}
                                onToggle={() => handleRowClick(quote)}
                                vipLabel={vipLabel}
                                vipVariant={vipVariant}
                                priceColor={priceColor}
                                onViewBreakdown={(e) => {
                                    e.stopPropagation()
                                    setActiveBreakdownQuote(quote)
                                }}
                                isMultiSelectMode={isMultiSelectMode}
                            />
                        )
                    })}
                    {filteredQuotes.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={isMultiSelectMode ? 5 : 5} className="text-center h-32 text-muted-foreground">
                            <p>{t('vehicle.quotes.no_match')}</p>
                            <Button variant="link" onClick={() => { setFilterVip(false); setFilterRating(false); setFilterFast(false); }}>{t('vehicle.quotes.clear_filters')}</Button>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
              </div>
            </div>

            <SimilarVehicles baseVehicleId={vehicle.id} />
          </div>

          {/* Right Column: Sticky Price Card */}
          <div className="lg:col-span-1 sticky top-24 space-y-4">
            <Card className="shadow-lg border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                    <CardDescription className="uppercase text-xs font-bold text-muted-foreground tracking-wider">
                    {t('vehicle.price_card.estimated_total')}
                    </CardDescription>
                    <Badge variant="outline" className="bg-background text-[10px] font-normal">
                        USD / GEL
                    </Badge>
                </div>
                <CardTitle className="text-4xl font-bold text-foreground flex items-baseline gap-2">
                  ${totalPrice.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground hidden sm:inline-block">USD</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  ≈ {(totalPrice * 2.7).toLocaleString()} GEL
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-dashed">
                    <span className="text-muted-foreground">{t('vehicle.price_card.auction_price')}</span>
                    <span>${auctionPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed">
                    <span className="text-muted-foreground">{t('vehicle.price_card.shipping')}</span>
                    <span>${shippingPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed">
                    <span className="text-muted-foreground">{t('vehicle.price_card.customs')}</span>
                    <span>${customsPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">{t('vehicle.price_card.service_fees')}</span>
                    <span>${brokerFee}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-base font-bold shadow-lg transition-all" 
                    onClick={() => {
                        if (selectedCompanyIds.length > 0) {
                            setIsLeadModalOpen(true)
                        } else {
                            document.getElementById('quotes-table')?.scrollIntoView({ behavior: 'smooth' })
                        }
                    }}
                    disabled={selectedCompanyIds.length === 0}
                  >
                    {selectedCompanyIds.length > 0 
                        ? t('vehicle.price_card.send_request', { count: selectedCompanyIds.length })
                        : t('vehicle.price_card.select_to_order')
                    }
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('vehicle.price_card.select_hint')}
                  </p>
                </div>

                <MarketPriceWidget price={totalPrice || 0} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SocialProofWidget />

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
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

      <Footer footerLinks={footerLinks} />
    </div>
  )
}

export default VehicleDetailsPage
