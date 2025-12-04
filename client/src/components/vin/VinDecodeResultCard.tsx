import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Icon } from '@iconify/react/dist/iconify.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCarImage } from '@/hooks/useCarImage'
import {
  getOrderedVinEntries,
  formatVinFieldKey,
  formatVinFieldValue,
  VIN_PRIMARY_KEYS,
  VIN_SECONDARY_KEYS,
} from '@/lib/vinFormatting'

export interface VinDecodeResultCardProps {
  vin: string
  data: Record<string, unknown> | null | undefined
}

// Helper to check if a car logo exists
const getBrandLogoPath = (make: string): string | null => {
  if (!make) return null
  const normalized = make.toLowerCase().replace(/[\s-]/g, '-')
  return `/car-logos/${normalized}.png`
}

export const VinDecodeResultCard: FC<VinDecodeResultCardProps> = ({ vin, data }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const entries = getOrderedVinEntries(data ?? undefined)
  const [showAllDetails, setShowAllDetails] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const { 
    vehicleTitle, 
    make,
    model,
    year,
    quickStats, 
    technicalSpecs, 
    bodySpecs,
    otherSpecs,
    highlights 
  } = useMemo(() => {
    const raw = (data || {}) as Record<string, any>
    
    // 1. Construct Title
    const makeStr = raw.make ? String(raw.make) : ''
    const modelStr = raw.model ? String(raw.model) : ''
    const yearStr = raw.model_year || raw.year ? String(raw.model_year || raw.year) : ''
    const trim = raw.trim ? String(raw.trim) : ''
    
    const titleParts = [yearStr, makeStr, modelStr, trim].filter(Boolean)
    const title = titleParts.length > 1 ? titleParts.join(' ') : t('vin.result_title', 'Vehicle Report')

    // 2. Extract Quick Stats
    const quickStats = {
      engine: [
        raw.engine_cylinders ? `${raw.engine_cylinders} Cyl` : null,
        raw.engine_displacement ? `${raw.engine_displacement}L` : null,
        raw.engine_power ? `${raw.engine_power}` : null
      ].filter(Boolean).join(' / ') || raw.engine_model || 'N/A',
      
      transmission: [
        raw.transmission_style,
        raw.transmission_speeds ? `${raw.transmission_speeds}-Speed` : null
      ].filter(Boolean).join(' ') || 'N/A',
      
      drive: raw.drive_type || 'N/A',
      fuel: raw.fuel_type || 'N/A',
      body: raw.body_class || raw.vehicle_type || 'N/A'
    }

    // 3. Group Specs
    const techKeys = new Set([...VIN_PRIMARY_KEYS, 'engine_cylinders', 'engine_displacement', 'engine_power', 'transmission_style', 'transmission_speeds', 'drive_type', 'fuel_type', 'turbo'])
    const bodyKeys = new Set([...VIN_SECONDARY_KEYS, 'body_class', 'vehicle_type', 'doors', 'gross_vehicle_weight_rating', 'wheel_base', 'cab_type', 'bed_type'])
    
    const technical: Array<[string, unknown]> = []
    const body: Array<[string, unknown]> = []
    const other: Array<[string, unknown]> = []

    entries.forEach(([key, value]) => {
      const lowerKey = key.toLowerCase()
      if (['make', 'model', 'year', 'model_year'].includes(lowerKey)) return

      if (techKeys.has(lowerKey) || lowerKey.includes('engine') || lowerKey.includes('brake') || lowerKey.includes('steering')) {
        technical.push([key, value])
      } else if (bodyKeys.has(lowerKey) || lowerKey.includes('weight') || lowerKey.includes('dimension') || lowerKey.includes('wheel') || lowerKey.includes('plant')) {
        body.push([key, value])
      } else {
        other.push([key, value])
      }
    })

    // 4. Highlights
    const highlightBadges: string[] = []
    const drive = String(raw.drive_type || '').toLowerCase()
    if (drive.includes('awd') || drive.includes('4wd') || drive.includes('4x4')) highlightBadges.push('AWD/4WD')
    if (String(raw.fuel_type).toLowerCase().includes('electric')) highlightBadges.push('Electric')
    if (String(raw.fuel_type).toLowerCase().includes('hybrid')) highlightBadges.push('Hybrid')
    if (String(raw.body_class).toLowerCase().includes('luxury')) highlightBadges.push('Luxury')
    if (String(raw.turbo || '').toLowerCase() === 'yes') highlightBadges.push('Turbo')

    return {
      vehicleTitle: title,
      make: makeStr,
      model: modelStr,
      year: yearStr,
      quickStats,
      technicalSpecs: technical,
      bodySpecs: body,
      otherSpecs: other,
      highlights: highlightBadges
    }
  }, [data, entries, t])

  // 3. Car Image Hook
  const { image: carImage } = useCarImage(`${make} ${model} ${year} car`)

  // Mock Import Estimate Logic
  const estimatedImportCost = useMemo(() => {
     if (!year) return null;
     // Simple mock calculation for "Sales" effect
     const base = 500;
     const yearFactor = Math.max(0, (parseInt(year) - 2010) * 50);
     const engineFactor = 200; // static since we don't parse L easily
     return base + yearFactor + engineFactor;
  }, [year]);

  const handleGoToCatalog = () => {
    if (!data || typeof data !== 'object') return
    const parts: string[] = []
    if (make) parts.push(make)
    if (model) parts.push(model)
    if (year) parts.push(year)
    const query = parts.join(' ').trim()
    const search = query ? `?q=${encodeURIComponent(query)}` : ''
    navigate(`/catalog${search}`)
  }

  const SpecRow = ({ label, value, index }: { label: string; value: unknown, index: number }) => (
    <div className={`flex justify-between py-2 px-3 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} border-b border-slate-100 last:border-0`}>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {formatVinFieldKey(label, t)}
      </dt>
      <dd className="text-xs sm:text-sm font-semibold text-slate-900 text-right pl-4">
        {formatVinFieldValue(value)}
      </dd>
    </div>
  )

  const logoPath = useMemo(() => getBrandLogoPath(make), [make])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="w-full overflow-hidden border border-slate-200 shadow-lg bg-white relative">
        
          {/* Car Photo Background */}
          {carImage && (
            <div className="absolute inset-0 h-56 w-full z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-white z-10" />
                <img 
                    src={carImage.url} 
                    alt={vehicleTitle} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 z-20 text-[10px] text-white/50">
                    {t('vin.photo_credit', { photographer: carImage.photographer })}
                </div>
            </div>
          )}

          {/* Hero Header */}
          <div className="relative z-10 pt-6 pb-6 px-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-[10px] text-slate-600 bg-white/90 border-slate-300">
                            VIN: {vin}
                        </Badge>
                        <Badge className="bg-[#f5a623] text-slate-900 hover:bg-[#f5a623]/90 border-none font-semibold">
                            <Icon icon="mdi:check-decagram" className="mr-1 h-3 w-3" />
                            {t('common.verified')}
                        </Badge>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                        {vehicleTitle}
                    </h2>
                    {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {highlights.map(h => (
                                <Badge key={h} className="bg-slate-900 hover:bg-slate-800 text-white border-none shadow-sm px-2.5 py-0.5 text-xs">
                                    {h}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    {logoPath && !logoError ? (
                        <img 
                            src={logoPath} 
                            alt={make} 
                            className="h-14 w-14 md:h-20 md:w-20 object-contain"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-slate-100 flex items-center justify-center">
                            <Icon icon="mdi:car" className="h-7 w-7 text-slate-400" />
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard Stats - Clean solid cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Icon icon="mdi:engine-outline" className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('vin.specs.engine')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 truncate" title={quickStats.engine}>{quickStats.engine}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Icon icon="mdi:transmission-box" className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('vin.specs.transmission')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 truncate" title={quickStats.transmission}>{quickStats.transmission}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Icon icon="mdi:car-traction-control" className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('vin.specs.drive')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 truncate" title={quickStats.drive}>{quickStats.drive}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Icon icon="mdi:gas-station-outline" className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('vin.specs.fuel')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 truncate" title={quickStats.fuel}>{quickStats.fuel}</span>
                </div>
            </div>
          </div>
          
          <CardContent className="p-0 relative z-10 bg-white">
            {entries.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Icon icon="mdi:alert-circle-outline" className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500">
                  {t('vin.result_empty_data', 'No additional data returned for this VIN.')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Split View for Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-t border-b border-slate-200">
                    {/* Left Col: Technical */}
                    <div className="p-0">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <Icon icon="mdi:cog-outline" className="h-4 w-4 text-slate-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">{t('vin.tech_specs_title')}</h3>
                        </div>
                        <dl>
                            {technicalSpecs.map(([k, v], i) => <SpecRow key={k} label={k} value={v} index={i} />)}
                            {technicalSpecs.length === 0 && <div className="p-4 text-xs text-slate-400 italic">No technical specs available.</div>}
                        </dl>
                    </div>

                    {/* Right Col: Body & Mfg */}
                    <div className="p-0">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <Icon icon="mdi:car-info" className="h-4 w-4 text-slate-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">{t('vin.body_specs_title')}</h3>
                        </div>
                        <dl>
                            {bodySpecs.map(([k, v], i) => <SpecRow key={k} label={k} value={v} index={i} />)}
                            {bodySpecs.length === 0 && <div className="p-4 text-xs text-slate-400 italic">No body specs available.</div>}
                        </dl>
                    </div>
                </div>

                {/* Other Details - Collapsible */}
                {otherSpecs.length > 0 && (
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowAllDetails(!showAllDetails)}
                            className="w-full justify-between bg-slate-50 hover:bg-slate-100 h-12 rounded-none px-6 border-b border-slate-200"
                        >
                            <span className="font-semibold text-sm flex items-center gap-2 text-slate-600">
                                <Icon icon="mdi:clipboard-list-outline" className="h-4 w-4" />
                                {t('vin.additional_details')}
                                <Badge variant="outline" className="ml-1 text-[10px] h-5 px-1.5 border-slate-300 text-slate-600">{otherSpecs.length}</Badge>
                            </span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${showAllDetails ? 'rotate-180' : ''}`}
                            />
                        </Button>

                        <AnimatePresence>
                        {showAllDetails && (
                            <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-slate-50"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 p-6">
                                    {otherSpecs.map(([k, value]) => (
                                        <div key={k} className="flex flex-col py-1 border-b border-slate-100">
                                            <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={formatVinFieldKey(k, t)}>
                                                {formatVinFieldKey(k, t)}
                                            </dt>
                                            <dd className="text-xs font-medium text-slate-800 break-words">
                                                {formatVinFieldValue(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Widgets & CTA (Sticky on Desktop) */}
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          
          {/* Feature 1: Estimated Cost Widget - Yellow accent */}
          {estimatedImportCost && (
             <Card className="border-none shadow-lg bg-[#f5a623] text-slate-900 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Icon icon="mdi:calculator" className="h-20 w-20" />
                 </div>
                 <CardContent className="p-5 relative z-10 space-y-4">
                    <div>
                        <h3 className="text-xs font-semibold opacity-80 uppercase tracking-wider">{t('vin.est_clearing_cost')}</h3>
                        <div className="text-4xl font-extrabold mt-1">
                            ${estimatedImportCost.toLocaleString()}
                        </div>
                        <p className="text-xs opacity-70 mt-1">{t('vin.est_clearing_note', { year })}</p>
                    </div>
                    <Button className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md" onClick={handleGoToCatalog}>
                        <Icon icon="mdi:calculator-variant" className="mr-2 h-4 w-4" />
                        {t('vin.get_exact_quote')}
                    </Button>
                 </CardContent>
             </Card>
          )}

          {/* Feature 2: Personalized Matching */}
          <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                       <div className="flex -space-x-2 overflow-hidden">
                            {[1,2,3].map(i => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center">
                                    <Icon icon="mdi:account" className="h-4 w-4 text-slate-500" />
                                </div>
                            ))}
                       </div>
                       <div className="text-sm font-semibold text-slate-900">
                           {t('vin.importers_match', { count: 12 })}
                       </div>
                  </div>
                  <p className="text-xs text-slate-500">
                      <Trans i18nKey="vin.verified_importers_desc" values={{ make }} components={{ strong: <strong className="text-slate-700" /> }} />
                  </p>
                  <Button onClick={handleGoToCatalog} size="lg" className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                      {t('vin.show_matches')}
                      <Icon icon="mdi:arrow-right" className="ml-2 h-4 w-4" />
                  </Button>
              </CardContent>
          </Card>

          {/* Feature 4: Market Demand (Social Proof) - Orange accent */}
          <Card className="border border-orange-200 shadow-sm bg-orange-50">
              <CardContent className="p-4 flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                      <Icon icon="mdi:fire" className="h-5 w-5" />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-orange-800">{t('vin.high_demand')}</h4>
                      <p className="text-xs text-orange-700/80 mt-0.5">
                          {t('vin.high_demand_desc', { count: 45, model })}
                      </p>
                  </div>
              </CardContent>
          </Card>

          {/* Feature 5: Risk Mitigation */}
          <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Icon icon="mdi:shield-check" className="h-4 w-4 text-slate-700" />
                      {t('vin.buy_safely')}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" size="sm" className="justify-start h-auto py-2 border-slate-200 hover:bg-slate-50">
                          <Icon icon="mdi:file-document-outline" className="mr-2 h-4 w-4 text-slate-500" />
                          <span className="font-medium text-xs text-slate-700">{t('vin.check_history')}</span>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start h-auto py-2 border-slate-200 hover:bg-slate-50">
                          <Icon icon="mdi:eye-outline" className="mr-2 h-4 w-4 text-slate-500" />
                          <span className="font-medium text-xs text-slate-700">{t('vin.order_inspection')}</span>
                      </Button>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  )
}

export default VinDecodeResultCard
