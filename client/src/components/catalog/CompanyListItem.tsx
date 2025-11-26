import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  className?: string;
  isCompareMode?: boolean;
}

export const CompanyListItem = memo(({ company, className, isCompareMode = false, isSelected, onToggleCompare }: CompanyListItemProps & { isSelected?: boolean, onToggleCompare?: (checked: boolean) => void }) => {
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
  
  // 1. Determine "Best For" Badge
  const bestForBadge = useMemo(() => {
    if (company.vipStatus) return { label: t('catalog.badges.luxury_expert', 'Luxury Expert'), icon: 'mdi:diamond-stone', color: 'bg-purple-50 text-purple-700 border-purple-100' };
    if ((company.priceRange?.min ?? 0) < 500) return { label: t('catalog.badges.best_economy', 'Best Economy'), icon: 'mdi:piggy-bank', color: 'bg-green-50 text-green-700 border-green-100' };
    if (company.rating >= 4.9) return { label: t('catalog.badges.top_rated', 'Top Rated'), icon: 'mdi:trophy', color: 'bg-amber-50 text-amber-700 border-amber-100' };
    return null;
  }, [company, t]);

  // 2. Mock Review Snippet (Simulating backend data)
  const reviewSnippet = useMemo(() => {
    if (company.rating >= 4.8) return "Привезли BMW X5 за 45 дней, состояние идеальное. Рекомендую!"; // Keep as is or use a generic translated string
    if (company.rating >= 4.5) return "Хорошая коммуникация, менеджер всегда на связи.";
    return "Прозрачные условия и честный расчет стоимости.";
  }, [company.rating]);

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
        className="group relative flex flex-col sm:flex-row bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden cursor-pointer"
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
                   <div className="bg-white/80 backdrop-blur-sm rounded-md p-0.5">
                     <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(v) => onToggleCompare?.(!!v)}
                        className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
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
          <div className="flex sm:flex-col items-center sm:items-center sm:justify-center gap-3 p-3 sm:w-28 sm:bg-slate-50/30 sm:border-r border-slate-100 shrink-0">
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
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{t('common.official')}</span>
                  <div className="flex gap-1">
                     <Icon icon="mdi:shield-check" className="h-3 w-3 text-blue-600" />
                     <Icon icon="mdi:gavel" className="h-3 w-3 text-red-600" />
                  </div>
               </div>
            )}
          </div>

          {/* Middle: Main Info */}
          <div className="flex-1 flex flex-col justify-center p-3 pl-0 sm:pl-5 space-y-2 min-w-0">
             {/* Header Row */}
             <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg leading-none group-hover:text-blue-600 transition-colors">
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

                {bestForBadge && (
                   <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 border bg-opacity-50", bestForBadge.color)}>
                      <Icon icon={bestForBadge.icon} className="h-3 w-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wide">{bestForBadge.label}</span>
                   </Badge>
                )}
             </div>

             {/* Compact Metadata */}
             <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1 text-slate-600">
                   <Icon icon="mdi:map-marker" className="h-3.5 w-3.5 text-slate-400" />
                   {company.location?.city || 'Tbilisi'}
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-slate-600">
                   <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5 text-slate-400" />
                   45-60 {t('common.days')}
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-1.5 rounded-full">
                   <Icon icon="mdi:star" className="h-3 w-3" />
                   {company.rating}
                   <span className="text-slate-400 font-normal ml-0.5">({company.reviewCount})</span>
                </div>
             </div>

             {/* Social Proof: Review Snippet */}
             <div className="hidden sm:flex items-start gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 max-w-xl">
                <Icon icon="mdi:format-quote-open" className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 italic line-clamp-1">
                   "{reviewSnippet}"
                </p>
             </div>
          </div>
        </div>

        {/* Right: Price & CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 p-2 sm:p-3 sm:w-44 bg-slate-50/30 sm:border-l border-t sm:border-t-0 border-slate-100">
           <div className="flex flex-col sm:items-end">
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-dashed border-slate-300">{t('catalog.card.service_fee')}</span>
                       <Icon icon="mdi:help-circle-outline" className="h-3 w-3 text-slate-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-xs">
                    Includes: Auction access, document processing, and pre-bid inspection.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-baseline gap-1">
                 <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                   {company.priceRange?.min ? formatCurrency(company.priceRange.min) : 'Ask'}
                 </span>
              </div>
              {company.priceRange?.max && (
                 <span className="text-[10px] text-slate-400 font-medium">
                   {t('catalog.card.up_to')} {formatCurrency(company.priceRange.max)}
                 </span>
              )}
           </div>

           <div className="flex flex-col gap-2 w-auto sm:w-auto">
             <Button 
               size="sm"
               variant="outline"
               className="h-8 px-4 text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all w-full"
               onClick={(e) => {
                 e.stopPropagation();
                 navigate(`/company/${company.id}`);
               }}
             >
               {t('catalog.card.view_profile')}
             </Button>
             {/* Mobile Comparison Toggle (Only visible if Compare Mode active) */}
             {isCompareMode && (
               <div 
                 className="sm:hidden flex items-center justify-center gap-2 text-xs text-slate-500 py-1 cursor-pointer"
                 onClick={(e) => {
                   e.stopPropagation();
                   onToggleCompare?.(!isSelected);
                 }}
               >
                 <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                 <span>{t('catalog.results.compare')}</span>
               </div>
             )}
           </div>
        </div>
      </article>
    </motion.div>
  );
});

CompanyListItem.displayName = 'CompanyListItem';
