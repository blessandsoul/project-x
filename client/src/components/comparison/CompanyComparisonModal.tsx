import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  // Helper for tooltips
  const LabelWithTooltip = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Icon icon="mdi:help-circle-outline" className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px] text-xs"><p>{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const formatCurrency = (val?: number) => 
    val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : 'N/A';

  // Comparison Rows Configuration
  const rows = [
    { 
      label: 'Rating', 
      tooltip: 'Average rating based on user reviews from Google and internal feedback.',
      icon: 'mdi:star-circle',
      render: (c: Company) => (
        <div className="flex flex-col items-center gap-0.5">
          <div className={cn("flex items-center gap-1 font-bold text-base", c.rating === bestRating ? "text-amber-500" : "text-slate-700")}>
            <Icon icon="mdi:star" className={cn("h-4 w-4", c.rating === bestRating ? "text-amber-500" : "text-slate-300")} />
            {c.rating}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{c.reviewCount} reviews</span>
        </div>
      )
    },
    {
      label: 'Service Fee',
      tooltip: 'The fixed fee charged by the company for their services (buying, documents, etc).',
      icon: 'mdi:cash-multiple',
      render: (c: Company) => {
        const isBest = c.priceRange?.min === minServiceFee;
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className={cn("text-lg font-black tracking-tight", isBest ? "text-emerald-600" : "text-slate-900")}>
              {formatCurrency(c.priceRange?.min)}
            </span>
            {c.priceRange?.max && (
              <span className="text-[9px] text-slate-400 uppercase font-medium">
                Up to {formatCurrency(c.priceRange.max)}
              </span>
            )}
            {isBest && <Badge className="h-3.5 text-[9px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5">Best Price</Badge>}
          </div>
        );
      }
    },
    {
      label: 'Trust Score',
      tooltip: 'Automated reliability score based on 20+ factors including transparency, history, and user feedback.',
      icon: 'mdi:shield-check',
      render: (c: Company) => {
        const score = c.trustScore ?? 0;
        const color = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : 'text-amber-500';
        const isBest = score === maxTrustScore;
        
        return (
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative h-10 w-10">
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
                <span className={cn("text-[11px] font-bold", color)}>{score}</span>
              </div>
            </div>
            {isBest && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Highest Trust</span>}
          </div>
        );
      }
    },
    {
      label: 'Delivery Time',
      tooltip: 'Estimated time from US auction yard to Poti, Georgia.',
      icon: 'mdi:clock-fast',
      render: () => (
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">45-60 Days</span>
      )
    },
    {
      label: 'Experience',
      tooltip: 'Years the company has been officially registered and operating.',
      icon: 'mdi:briefcase-clock',
      render: (c: Company) => (
        <div className="text-sm font-medium text-slate-600">
          {c.establishedYear ? (
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-900">{new Date().getFullYear() - c.establishedYear}</span> Years
            </span>
          ) : <span className="text-slate-300">-</span>}
        </div>
      )
    },
    {
      label: 'Official Partners',
      tooltip: 'Whether the company is an authorized broker for Copart or IAAI.',
      icon: 'mdi:certificate',
      render: (c: Company) => c.vipStatus ? (
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <div className="p-1 bg-blue-50 rounded text-blue-600"><Icon icon="mdi:shield-check" className="h-3.5 w-3.5" /></div>
            <div className="p-1 bg-red-50 rounded text-red-600"><Icon icon="mdi:gavel" className="h-3.5 w-3.5" /></div>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 uppercase">Verified Broker</span>
        </div>
      ) : <span className="text-slate-300 text-xs">Standard Access</span>
    },
    {
      label: 'Onboarding',
      tooltip: 'Is the initial consultation and calculation free?',
      icon: 'mdi:human-greeting',
      render: (c: Company) => c.onboarding?.isFree ? (
        <div className="flex flex-col items-center gap-0.5">
          <Icon icon="mdi:check-circle" className="h-5 w-5 text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Free Consult</span>
        </div>
      ) : (
        <span className="text-xs text-slate-400 font-medium">Paid</span>
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
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Window */}
          <motion.div
            className="relative bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0 z-20 relative">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Icon icon="mdi:compare-horizontal" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Compare Companies</h2>
                  <p className="text-xs text-slate-500">Analyzing {companies.length} selected options side-by-side</p>
                </div>
              </div>
              
              {/* Sticky Header CTA */}
              <div className="flex items-center gap-2">
                 <div className="hidden sm:flex items-center text-xs text-slate-500 mr-2">
                    <Icon icon="mdi:information-outline" className="mr-1 h-3.5 w-3.5" />
                    <span>Highlighted cells indicate best value</span>
                 </div>
                 <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                   <Icon icon="mdi:close" className="h-5 w-5" />
                 </Button>
              </div>
            </div>

            {/* Content Area with Sticky Columns */}
            <div className="flex-1 overflow-auto relative bg-slate-50/50">
              <div className="min-w-max grid" style={{ gridTemplateColumns: `140px repeat(${companies.length}, minmax(200px, 1fr))` }}>
                
                {/* --- Sticky Header Row (Logos) --- */}
                
                {/* Top-Left Corner (Sticky x & y) */}
                <div className="sticky top-0 left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-4 flex items-end pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Criteria</span>
                </div>

                {/* Company Headers (Sticky top) */}
                {companies.map((company) => {
                  const isBestOverall = (company.trustScore ?? 0) >= 90 && company.rating >= 4.8;
                  return (
                    <div key={company.id} className="sticky top-0 z-20 bg-white border-b border-r border-slate-100 p-4 flex flex-col items-center gap-2.5 relative overflow-hidden">
                      {isBestOverall && (
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
                      )}
                      
                      <div className="relative h-12 w-12 group-hover:scale-105 transition-transform">
                        <img src={company.logo ?? ''} alt={company.name} className="h-full w-full object-cover rounded-full shadow-sm" />
                        {company.vipStatus && (
                          <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm ring-1 ring-slate-50">
                            <Icon icon="mdi:crown" className="h-5 w-5 text-amber-500" />
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1 mb-0.5">{company.name}</h3>
                        {isBestOverall ? (
                           <Badge className="h-4 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-[9px] font-bold shadow-sm">
                              <Icon icon="mdi:trophy" className="mr-1 h-3 w-3" /> Recommended
                           </Badge>
                         ) : (
                           <div className="flex items-center justify-center gap-1 text-xs text-slate-500 h-5">
                             <Icon icon="mdi:map-marker" className="h-3 w-3" />
                             {company.location?.city || 'Georgia'}
                           </div>
                        )}
                      </div>
                      
                      {/* Header CTA */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-[11px] font-semibold rounded-full border-slate-300 text-slate-700 bg-white hover:bg-slate-100 mt-1"
                      >
                        Select
                      </Button>
                    </div>
                  );
                })}

                {/* --- Comparison Rows --- */}
                
                {rows.map((row) => (
                  <div key={row.label} className="contents group">
                    {/* Row Label (Sticky left) */}
                    <div className="sticky left-0 z-10 bg-white border-r border-slate-200 border-b border-slate-100 p-3 flex items-center gap-1.5 group-hover:bg-slate-50/80 transition-colors">
                      <Icon icon={row.icon} className="h-5 w-5 text-slate-400 shrink-0" />
                      {row.tooltip ? (
                         <LabelWithTooltip label={row.label} tooltip={row.tooltip} />
                      ) : (
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{row.label}</span>
                      )}
                    </div>

                    {/* Company Data Cells */}
                    {companies.map((company) => (
                      <div key={`${company.id}-${row.label}`} className="bg-white border-r border-slate-100 border-b border-slate-100 p-3 flex items-center justify-center group-hover:bg-slate-50/50 transition-colors relative">
                        {row.render(company)}
                      </div>
                    ))}
                  </div>
                ))}

                {/* --- CTA Footer Row --- */}
                <div className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 p-3" />
                {companies.map((company) => (
                  <div key={`cta-${company.id}`} className="bg-slate-50 border-r border-slate-200 p-3 flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Icon icon="mdi:check-bold" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
