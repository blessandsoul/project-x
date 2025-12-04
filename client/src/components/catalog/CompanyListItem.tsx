import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  className?: string;
  isCompareMode?: boolean;
  /** Calculated shipping price from selected auction branch. If undefined, shows placeholder. */
  calculatedShippingPrice?: number;
  /** Whether an auction branch has been selected */
  hasAuctionBranch?: boolean;
  /** Whether shipping prices are currently being loaded */
  isLoadingShipping?: boolean;
}

export const CompanyListItem = memo(({ company, className, isCompareMode = false, isSelected, onToggleCompare, calculatedShippingPrice, hasAuctionBranch = false, isLoadingShipping = false }: CompanyListItemProps & { isSelected?: boolean, onToggleCompare?: (checked: boolean) => void }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Mock Logic for Visuals (Since API is read-only for now) ---



  // 3. Mock Online Status (Randomized for demo, heavily weighted to 'online' for high rated)
  const isOnline = useMemo(() => company.rating > 4.5, [company.rating]);

  // 4. Trust Score Visuals
  const trustScoreColor = (company.trustScore ?? 0) >= 90 ? 'text-green-500' : (company.trustScore ?? 0) >= 70 ? 'text-blue-500' : 'text-amber-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -1 }}
      className={cn("w-full", className)}
    >
      {/* Semantic Article */}
      <article 
        className="group relative flex flex-col sm:flex-row bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg hover:shadow-xl hover:border-primary/40 hover:bg-white/10 transition-all duration-200 overflow-hidden cursor-pointer"
        onClick={() => {
          if (isCompareMode) {
            onToggleCompare?.(!isSelected);
          } else {
            navigate(`/company/${company.id}`);
          }
        }}
      >
        {/* Compare Checkbox (Floating/Absolute on Desktop to save space) */}
        {isCompareMode && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <div className="bg-black/40 backdrop-blur-sm rounded-md p-0.5">
                     <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(v) => onToggleCompare?.(!!v)}
                        className="h-4 w-4 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                     />
                   </div>
                 </TooltipTrigger>
                 <TooltipContent side="right"><p>{t('catalog.card.add_to_compare')}</p></TooltipContent>
               </Tooltip>
             </TooltipProvider>
          </div>
        )}

        {/* Mobile Wrapper for Logo + Info */}
        <div className="flex flex-row w-full sm:contents">
          {/* Left: Logo & Partners */}
          <div className="flex sm:flex-col items-center sm:items-center sm:justify-center gap-3 p-3 sm:w-28 sm:bg-white/5 sm:border-r border-white/10 shrink-0">
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 group-hover:scale-105 transition-transform">
              <Image 
                src={company.logo ?? ''} 
                alt={`${company.name} logo`} 
                className="h-full w-full object-cover rounded-full shadow-sm" 
              />
              {/* Online Indicator */}
              {isOnline && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('catalog.card.online_now')}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Official Partners (Mock Visuals) */}
            {company.vipStatus && (
               <div className="hidden sm:flex flex-col items-center gap-0.5 mt-1 opacity-70 grayscale group-hover:grayscale-0 transition-all">
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{t('common.official')}</span>
                  <div className="flex gap-1">
                     <Icon icon="mdi:shield-check" className="h-3 w-3 text-blue-400" />
                     <Icon icon="mdi:gavel" className="h-3 w-3 text-red-400" />
                  </div>
               </div>
            )}
          </div>

          {/* Middle: Main Info */}
          <div className="flex-1 flex flex-col justify-center p-3 pl-0 sm:pl-5 space-y-2 min-w-0">
             {/* Header Row */}
             <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-lg leading-none group-hover:text-primary transition-colors">
                  {company.name}
                </h3>
                
                {/* Trust Score Circle (Gamification) */}
                {company.trustScore && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                             <div className="relative h-5 w-5">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
                                   <circle className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                   <circle 
                                      className={trustScoreColor} 
                                      strokeWidth="3" 
                                      strokeDasharray={62.8}
                                      strokeDashoffset={62.8 - (62.8 * company.trustScore) / 100}
                                      strokeLinecap="round" 
                                      stroke="currentColor" 
                                      fill="transparent" 
                                      r="10" cx="12" cy="12" 
                                   />
                                </svg>
                             </div>
                             <span className={cn("text-xs font-bold", trustScoreColor)}>{company.trustScore}</span>
                          </div>
                       </TooltipTrigger>
                       <TooltipContent side="top"><p>Trust Score: High Reliability</p></TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                )}

             </div>

             {/* Compact Metadata */}
             <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-white/60 font-medium">
                <div className="flex items-center gap-1 text-white/70">
                   <Icon icon="mdi:map-marker" className="h-3.5 w-3.5 text-white/40" />
                   {company.location?.city || 'Tbilisi'}
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1 text-white/70">
                   <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5 text-white/40" />
                   45-60 {t('common.days')}
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/20 px-1.5 rounded-full">
                   <Icon icon="mdi:star" className="h-3 w-3" />
                   {company.rating}
                   <span className="text-white/50 font-normal ml-0.5">({company.reviewCount})</span>
                </div>
             </div>

          </div>
        </div>

        {/* Right: Price & CTA (only shown when an auction branch is selected) */}
        {hasAuctionBranch && (
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 p-2 sm:p-3 sm:w-44 bg-white/5 sm:border-l border-t sm:border-t-0 border-white/10">
             <div className="flex flex-col sm:items-end">
                {isLoadingShipping ? (
                  // Loading state
                  <>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                      {t('catalog.card.shipping_cost', 'Shipping Cost')}
                    </span>
                    <div className="flex items-center gap-2 py-1">
                      <Icon icon="mdi:loading" className="h-5 w-5 text-primary animate-spin" />
                      <span className="text-sm text-white/60 font-medium">
                        {t('common.calculating', 'Calculating...')}
                      </span>
                    </div>
                  </>
                ) : (
                  // Show price or contact
                  <>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                             <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider border-b border-dashed border-white/20">{t('catalog.card.shipping_cost', 'Shipping Cost')}</span>
                             <Icon icon="mdi:help-circle-outline" className="h-3 w-3 text-white/40" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px] text-xs">
                          {t('catalog.card.shipping_tooltip', 'Estimated shipping from selected auction branch to Poti, Georgia.')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex items-baseline gap-1">
                       <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                         {calculatedShippingPrice !== undefined && calculatedShippingPrice >= 0 
                           ? formatCurrency(calculatedShippingPrice) 
                           : t('catalog.card.contact', 'Contact')}
                       </span>
                    </div>
                    {calculatedShippingPrice !== undefined && calculatedShippingPrice >= 0 ? (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                        <Icon icon="mdi:map-marker-check" className="h-3 w-3" />
                        {t('catalog.card.location_based', 'Location-based')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40 font-medium">
                        {t('catalog.card.for_pricing', 'for pricing')}
                      </span>
                    )}
                  </>
                )}
             </div>

             {/* Mobile Comparison Toggle (Only visible if Compare Mode active) */}
             {isCompareMode && (
               <div 
                 className="sm:hidden flex items-center justify-center gap-2 text-xs text-white/60 py-1 cursor-pointer"
                 onClick={(e) => {
                   e.stopPropagation();
                   onToggleCompare?.(!isSelected);
                 }}
               >
                 <Checkbox checked={isSelected} className="h-3.5 w-3.5 border-white/30" />
                 <span>{t('catalog.results.compare')}</span>
               </div>
             )}
          </div>
        )}
      </article>
    </motion.div>
  );
});

CompanyListItem.displayName = 'CompanyListItem';
