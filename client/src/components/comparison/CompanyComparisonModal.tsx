import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

// Import custom Image component or use standard img
// import { Image } from '@/components/ui/image'; // Commented out as it's not being used

interface CompanyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
}

export function CompanyComparisonModal({
  isOpen,
  onClose,
  companies,
}: CompanyComparisonModalProps) {
  // Helper to find best values for highlighting
  const bestRating = Math.max(...companies.map(c => c.rating));
  const minServiceFee = Math.min(...companies.map(c => c.priceRange?.min ?? Infinity));
  const maxTrustScore = Math.max(...companies.map(c => c.trustScore ?? 0));

  // Determine a single "best overall" company for highlighting (header stripe and bottom checkmark)
  const bestOverallCompanyId = companies.reduce<number | null>((bestId, company) => {
    const currentScore = (company.trustScore ?? 0) * 100 + company.rating * 10;

    if (bestId === null) {
      return company.id;
    }

    const bestCompany = companies.find(c => c.id === bestId);
    if (!bestCompany) {
      return company.id;
    }

    const bestScore = (bestCompany.trustScore ?? 0) * 100 + bestCompany.rating * 10;
    return currentScore > bestScore ? company.id : bestId;
  }, null);

  // Helper for tooltips
  const LabelWithTooltip = ({ label }: { label: string, tooltip: string }) => (
    <span className="text-[8px] lg:text-[10px] font-semibold text-slate-600 uppercase tracking-tight leading-tight whitespace-pre-line break-words max-w-[68px] lg:max-w-[90px]">
      {label}
    </span>
  );

  const formatCurrency = (val?: number) => 
    val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : '—';

  // Comparison Rows Configuration
  const rows = [
    { 
      label: 'რეიტინგი', 
      tooltip: 'Average rating based on user reviews from Google and internal feedback.',
      icon: 'mdi:star-circle',
      render: (c: Company) => (
        <div className="flex flex-col items-center gap-0.5">
          <div className={cn("flex items-center gap-1 font-bold text-sm lg:text-base", c.rating === bestRating ? "text-amber-500" : "text-slate-700")}>
            <Icon icon="mdi:star" className={cn("h-3.5 w-3.5", c.rating === bestRating ? "text-amber-500" : "text-slate-300")} />
            {c.rating}
          </div>
          <span className="text-[9px] lg:text-[11px] text-slate-400 font-medium">{c.reviewCount} შეფასება</span>
        </div>
      )
    },
    {
      label: 'სერვისის\nსაფასური',
      tooltip: 'The fixed fee charged by the company for their services (buying, documents, etc).',
      icon: 'mdi:cash-multiple',
      render: (c: Company) => {
        const isBest = c.priceRange?.min === minServiceFee;
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className={cn("text-base lg:text-lg font-black tracking-tight", isBest ? "text-emerald-600" : "text-slate-900")}>
              {formatCurrency(c.priceRange?.min)}
            </span>
            {c.priceRange?.max && (
              <span className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-medium">
                მაქსიმუმ {formatCurrency(c.priceRange.max)}
              </span>
            )}
            {isBest && <Badge className="h-3 lg:h-4 text-[8px] lg:text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5">საუკეთესო ფასი</Badge>}
          </div>
        );
      }
    },
    {
      label: 'სანდოობის\nქულა',
      icon: 'mdi:shield-check',
      render: (c: Company) => {
        const score = c.trustScore ?? 0;
        const color = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : 'text-amber-500';
        const isBest = score === maxTrustScore;
        
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="relative h-9 w-9">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
                <circle className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                <circle 
                  className={color} 
                  strokeWidth="2.5" 
                  strokeDasharray={62.8}
                  strokeDashoffset={62.8 - (62.8 * score) / 100}
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="10" cx="12" cy="12" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-[10px] lg:text-xs font-bold", color)}>{score}</span>
              </div>
            </div>
            {isBest && <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wide">უმაღლესი სანდოობა</span>}
          </div>
        );
      }
    },
    {
      label: 'მიწოდების\nდრო',
      tooltip: 'Estimated time from US auction yard to Poti, Georgia.',
      icon: 'mdi:clock-fast',
      render: () => (
        <span className="text-[10px] lg:text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">45-60 დღე</span>
      )
    },
    {
      label: 'გამოცდილება',
      tooltip: 'Years the company has been officially registered and operating.',
      icon: 'mdi:briefcase-clock',
      render: (c: Company) => (
        <div className="text-xs lg:text-sm font-medium text-slate-600">
          {c.establishedYear ? (
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-900">{new Date().getFullYear() - c.establishedYear}</span> წელი
            </span>
          ) : <span className="text-slate-300">-</span>}
        </div>
      )
    },
    {
      label: 'ოფიციალური\nპარტნიორები',
      tooltip: 'Whether the company is an authorized broker for Copart or IAAI.',
      icon: 'mdi:certificate',
      render: (c: Company) => c.vipStatus ? (
        <div className="flex flex-col items-center gap-0.5">
          <Icon icon="mdi:checkbox-marked-circle" className="h-4 w-4 text-emerald-500" />
          <span className="text-[8px] lg:text-[10px] font-semibold text-slate-500 uppercase">დადასტურებული ბროკერი</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <Icon icon="mdi:checkbox-blank-circle-outline" className="h-4 w-4 text-slate-300" />
          <span className="text-[8px] lg:text-[10px] font-semibold text-slate-400 uppercase">სტანდარტული წვდომა</span>
        </div>
      )
    },
    {
      label: 'საწყისი\nკონსულტაცია',
      tooltip: 'Is the initial consultation and calculation free?',
      icon: 'mdi:human-greeting',
      render: (c: Company) => c.onboarding?.isFree ? (
        <div className="flex flex-col items-center gap-0.5">
          <Icon icon="mdi:check-circle" className="h-4 w-4 text-emerald-500" />
          <span className="text-[9px] lg:text-[11px] font-bold text-emerald-700 uppercase tracking-wide">უფასო კონსულტაცია</span>
        </div>
      ) : (
        <span className="text-[10px] lg:text-xs text-slate-400 font-medium">ფასიანი</span>
      )
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Window */}
          <motion.div
            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl shadow-primary/10 flex flex-col overflow-hidden border-2 border-primary/20"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            {/* Accent top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-sub to-accent rounded-t-2xl z-30" />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0 z-20 relative">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Icon icon="mdi:compare-horizontal" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">კომპანიების შედარება</h2>
                  <p className="text-xs text-slate-500">ვადარებთ {companies.length} კომპანიას</p>
                </div>
              </div>
              
              {/* Sticky Header CTA */}
              <div className="flex items-center gap-2">
                 <div className="hidden sm:flex items-center text-xs text-slate-500 mr-2">
                    <Icon icon="mdi:information-outline" className="mr-1 h-3.5 w-3.5" />
                    <span>გამოკვეთილი უჯრები საუკეთესო მნიშვნელობას აჩვენებს</span>
                 </div>
                 <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                   <Icon icon="mdi:close" className="h-5 w-5" />
                 </Button>
              </div>
            </div>

            {/* Content Area with Sticky Columns */}
            <div className="flex-1 overflow-auto relative bg-slate-50/50">
              <div className="h-full">
                <div className="min-w-max grid" style={{ gridTemplateColumns: `120px repeat(${companies.length}, minmax(120px, 1fr))` }}>
                  
                  {/* --- Sticky Header Row (Logos) --- */}
                  
                  {/* Top-Left Corner (Sticky x & y) */}
                  <div className="sticky top-0 left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-2.5 flex items-center justify-center">
                    <Icon icon="mdi:format-list-bulleted-square" className="h-4 w-4 text-slate-400" />
                  </div>

                  {/* Company Headers (Sticky top) */}
                  {companies.map((company) => {
                    const isBestOverall = company.id === bestOverallCompanyId;
                    return (
                      <div key={company.id} className="sticky top-0 z-20 bg-white border-b border-r border-slate-100 p-3 flex flex-col items-center gap-2.5 relative overflow-hidden">
                        {isBestOverall && (
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
                        )}
                        
                        <div className="relative h-10 w-10 group-hover:scale-105 transition-transform">
                          <img src={company.logo ?? ''} alt={company.name} className="h-full w-full object-cover rounded-full shadow-sm" />
                          {company.vipStatus && (
                            <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm ring-1 ring-slate-50">
                              <Icon icon="mdi:crown" className="h-4 w-4 text-amber-500" />
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full">
                          <h3 className="font-semibold text-slate-900 text-[9px] lg:text-xs leading-tight line-clamp-2 mb-0.5 break-words max-w-[80px] mx-auto">
                            {company.name}
                          </h3>
                          {isBestOverall ? (
                             <Badge className="h-4 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-[9px] font-bold shadow-sm">
                                <Icon icon="mdi:trophy" className="mr-1 h-3 w-3" /> რეკომენდებული
                             </Badge>
                           ) : (
                             <div className="flex items-center justify-center gap-1 text-xs text-slate-500 h-5">
                               <Icon icon="mdi:map-marker" className="h-3 w-3" />
                               {company.location?.city || 'საქართველო'}
                             </div>
                          )}
                        </div>
                        
                        {/* Header CTA */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[10px] font-semibold rounded-full border-slate-300 text-slate-700 bg-white hover:bg-slate-100 mt-1"
                          onClick={() => {
                            window.open(`/company/${company.id}`, '_blank');
                          }}
                        >
                          არჩევა
                        </Button>
                      </div>
                    );
                  })}

                  {/* --- Comparison Rows --- */}
                  
                  {rows.map((row) => (
                    <div key={row.label} className="contents group">
                      {/* Row Label (Sticky left) */}
                      <div className="sticky left-0 z-10 bg-white border-r border-slate-200 border-b border-slate-100 px-1.5 py-1 flex items-center gap-1 group-hover:bg-slate-50/80 transition-colors">
                        <Icon icon={row.icon} className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {row.tooltip ? (
                           <LabelWithTooltip label={row.label} tooltip={row.tooltip} />
                        ) : (
                           <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-tight whitespace-pre-line break-words max-w-[68px]">{row.label}</span>
                        )}
                      </div>

                      {/* Company Data Cells */}
                      {companies.map((company) => (
                        <div key={`${company.id}-${row.label}`} className="bg-white border-r border-slate-100 border-b border-slate-100 p-2 flex items-center justify-center group-hover:bg-slate-50/50 transition-colors relative">
                          {row.render(company)}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* --- CTA Footer Row --- */}
                  <div className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 p-2.5" />
                  {companies.map((company) => {
                    const isBestOverall = company.id === bestOverallCompanyId;
                    return (
                      <div key={`cta-${company.id}`} className="bg-slate-50 border-r border-slate-200 p-2.5 flex items-center justify-center">
                        <Button
                          variant={isBestOverall ? 'default' : 'outline'}
                          size="icon"
                          className={cn(
                            'rounded-full border-slate-300',
                            isBestOverall
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500 shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          )}
                        >
                          <Icon icon="mdi:check-bold" className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
