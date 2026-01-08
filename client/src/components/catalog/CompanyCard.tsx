import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Image } from '@/components/ui/image';
import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: Company;
  className?: string;
}

export const CompanyCard = memo(({ company, className }: CompanyCardProps) => {
  const navigate = useNavigate();

  // Format currency for price range
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn("h-full", className)}
    >
      <Card className="h-full flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group cursor-pointer" onClick={() => navigate(`/company/${company.id}`)}>
        {/* Header with Logo & Badges */}
        <CardHeader className="p-5 pb-2 space-y-4">
          <div className="flex justify-between items-start">
            <div className="relative">
              <div className="h-16 w-16 rounded-xl border border-slate-100 bg-white p-1 shadow-sm overflow-hidden group-hover:border-blue-100 transition-colors">
                <Image
                  src={company.logo ?? ''}
                  alt={company.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {company.vipStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
                        <Icon icon="mdi:crown" className="h-5 w-5 text-amber-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>VIP Partner</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                <Icon icon="mdi:star" className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-slate-900">{company.rating}</span>
                <span className="text-xs text-slate-500">({company.reviewCount})</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {company.name}
              </h3>
              {company.trustScore && company.trustScore >= 90 && (
                <Badge variant="secondary" className="h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 gap-1 px-1.5">
                  <Icon icon="mdi:check-decagram" className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Verified</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-slate-500 gap-1">
              <Icon icon="mdi:map-marker-outline" className="h-4 w-4" />
              <span className="line-clamp-1">{company.location?.city || 'Tbilisi, Georgia'}</span>
            </div>
          </div>
        </CardHeader>

        <Separator className="bg-slate-100" />

        {/* Body Content */}
        <CardContent className="p-5 py-4 flex-grow space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Timeline</p>
              <p className="text-sm font-semibold text-slate-900">45-60 days</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Experience</p>
              <p className="text-sm font-semibold text-slate-900">
                {company.establishedYear ? `${new Date().getFullYear() - company.establishedYear} Years` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Features tags */}
          {company.services && company.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {company.services.slice(0, 3).map((service, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-medium text-slate-600">
                  {service}
                </span>
              ))}
              {company.services.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-[10px] font-medium text-slate-500">
                  +{company.services.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <Separator className="bg-slate-100" />

        {/* Footer with Price & Action */}
        <CardFooter className="p-5 pt-4 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Service Fee</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                {company.priceRange?.min ? formatCurrency(company.priceRange.min) : 'Ask'}
              </span>
              {company.priceRange?.max && (
                <span className="text-xs text-slate-400 font-medium">
                  - {formatCurrency(company.priceRange.max)}
                </span>
              )}
            </div>
          </div>

          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-semibold px-6"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/company/${company.id}`);
            }}
          >
            View Profile
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
});

CompanyCard.displayName = 'CompanyCard';
