import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterTag } from '@/components/company/FilterTag'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@iconify/react'
import { motion, useReducedMotion } from 'framer-motion'
import { mockSearchFilters } from '@/mocks/_mockData'
import { cn } from '@/lib/utils'

interface QuickFiltersState {
  geography?: string
  service?: string
  rating: string
  vipOnly: boolean
}

const STORAGE_KEY = 'projectx_quicksearch_filters'

function loadInitialFilters(): QuickFiltersState {
  if (typeof window === 'undefined') return { rating: '0', vipOnly: false }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : { rating: '0', vipOnly: false }
  } catch {
    return { rating: '0', vipOnly: false }
  }
}

export function QuickSearchSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<QuickFiltersState>(() => loadInitialFilters())
  const shouldReduceMotion = useReducedMotion()

  const persistFilters = (next: QuickFiltersState) => {
    setFilters(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (Number(filters.rating) > 0) params.set('rating', filters.rating)
    if (filters.vipOnly) params.set('vipOnly', '1')
    if (filters.geography) params.set('geography', filters.geography)
    if (filters.service) params.set('service', filters.service)
    navigate(`/catalog?${params.toString()}`)
  }

  const handleReset = () => {
    const next = { rating: '0', vipOnly: false, geography: undefined, service: undefined }
    persistFilters(next)
    navigate('/catalog')
  }

  const applyPreset = (preset: Partial<QuickFiltersState>) => {
    const next = { ...filters, ...preset }
    persistFilters(next)
    const params = new URLSearchParams()
    if (Number(next.rating) > 0) params.set('rating', next.rating)
    if (next.vipOnly) params.set('vipOnly', '1')
    if (next.geography) params.set('geography', next.geography)
    if (next.service) params.set('service', next.service)
    navigate(`/catalog?${params.toString()}`)
  }

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12 bg-background relative z-10 -mt-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl border-none shadow-black/5 overflow-hidden">
            {/* Header Gradient Stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
            
            <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Main Search Controls */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Icon icon="mdi:tune-vertical" className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight">{t('home.quick_search.title')}</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('home.quick_search.state_label')}</label>
                                <Select value={filters.geography} onValueChange={(v) => persistFilters({ ...filters, geography: v })}>
                                    <SelectTrigger className="h-11 bg-muted/30 border-transparent hover:border-primary/20 focus:ring-primary/20">
                                        <SelectValue placeholder={t('home.quick_search.state_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockSearchFilters.geography.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('home.quick_search.service_label')}</label>
                                <Select value={filters.service} onValueChange={(v) => persistFilters({ ...filters, service: v })}>
                                    <SelectTrigger className="h-11 bg-muted/30 border-transparent hover:border-primary/20 focus:ring-primary/20">
                                        <SelectValue placeholder={t('home.quick_search.service_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockSearchFilters.services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('home.quick_search.rating_label')}</label>
                                <Select value={filters.rating} onValueChange={(v) => persistFilters({ ...filters, rating: v })}>
                                    <SelectTrigger className="h-11 bg-muted/30 border-transparent hover:border-primary/20 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">{t('home.quick_search.rating_all')}</SelectItem>
                                        <SelectItem value="3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-amber-500">
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                </div>
                                                <span>3+</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-amber-500">
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                </div>
                                                <span>4+</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-amber-500">
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                    <Icon icon="mdi:star" className="h-3.5 w-3.5" />
                                                </div>
                                                <span>5 Only</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col justify-end gap-3">
                                <div className="flex items-center space-x-2 h-11 px-3 rounded-md border border-transparent hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => persistFilters({ ...filters, vipOnly: !filters.vipOnly })}>
                                    <Checkbox id="vip-mode" checked={filters.vipOnly} onCheckedChange={(v) => persistFilters({ ...filters, vipOnly: !!v })} />
                                    <label htmlFor="vip-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none flex items-center gap-2">
                                        {t('home.quick_search.vip_only')}
                                        <Icon icon="mdi:crown" className={cn("h-4 w-4 transition-colors", filters.vipOnly ? "text-yellow-500" : "text-muted-foreground")} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-2">
                            <Button size="lg" className="flex-1 sm:flex-none min-w-[160px] shadow-lg shadow-primary/20" onClick={handleSearch}>
                                <Icon icon="mdi:magnify" className="mr-2 h-5 w-5" />
                                {t('home.quick_search.search_btn')}
                            </Button>
                            <Button variant="ghost" size="lg" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                                {t('home.quick_search.reset_btn')}
                            </Button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px bg-border/50" />

                    {/* Presets Sidebar */}
                    <div className="md:w-64 space-y-4 shrink-0">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                             <Icon icon="mdi:lightning-bolt" className="h-4 w-4 text-yellow-500" />
                             <span>Popular Scenarios</span>
                        </div>
                        <div className="flex flex-col gap-2">
                             <button 
                                onClick={() => applyPreset({ geography: 'California', rating: '4', vipOnly: true })}
                                className="text-left p-3 rounded-lg bg-muted/30 hover:bg-primary/5 hover:text-primary transition-colors text-sm group"
                             >
                                <span className="font-medium block mb-0.5">Trusted California</span>
                                <span className="text-xs text-muted-foreground group-hover:text-primary/70">High rating + VIP</span>
                             </button>
                             <button 
                                onClick={() => applyPreset({ service: 'Shipping', rating: '3', vipOnly: false })}
                                className="text-left p-3 rounded-lg bg-muted/30 hover:bg-primary/5 hover:text-primary transition-colors text-sm group"
                             >
                                <span className="font-medium block mb-0.5">Fast Shipping</span>
                                <span className="text-xs text-muted-foreground group-hover:text-primary/70">Logistics focus</span>
                             </button>
                             <button 
                                onClick={() => applyPreset({ rating: '5', vipOnly: true })}
                                className="text-left p-3 rounded-lg bg-muted/30 hover:bg-primary/5 hover:text-primary transition-colors text-sm group"
                             >
                                <span className="font-medium block mb-0.5">Premium Only</span>
                                <span className="text-xs text-muted-foreground group-hover:text-primary/70">5 Stars + VIP</span>
                             </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </motion.section>
  )
}
