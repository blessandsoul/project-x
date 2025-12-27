import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Image } from '@/components/ui/image';

import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyRowItemProps {
    company: Company;
    className?: string;
}

export const CompanyRowItem = memo(({ company, className }: CompanyRowItemProps) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Online Status based on rating
    const isOnline = useMemo(() => company.rating > 4.5, [company.rating]);

    const handleViewDetails = () => {
        navigate(`/company/${company.id}`);
    };

    const capitalize = (str: string | undefined | null): string => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const cityDisplay = capitalize(company.location?.city) || t('catalog.card.default_city', 'Tbilisi');

    return (
        <div
            className={cn(
                "relative grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 md:gap-4 items-center rounded-lg border border-slate-200 bg-white shadow-sm px-2 py-2.5 md:px-5 md:py-3 cursor-pointer",
                "transition-all duration-200 hover:bg-slate-50/50 hover:shadow-md hover:border-slate-300",
                className
            )}
            onClick={() => navigate(`/company/${company.id}`)}
        >
            {/* Column 1: Logo + Company Name + Location (Takes available space) */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {/* Logo with Status Dot Overlay */}
                <div className="relative flex-shrink-0 h-11 w-11 md:h-[54px] md:w-[54px]">
                    <button
                        type="button"
                        className="h-full w-full rounded-lg overflow-hidden bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails();
                        }}
                    >
                        <Image
                            src={company.logo || '/car-logos/toyota.png'}
                            alt={`${company.name} logo`}
                            className="h-full w-full"
                            fallbackSrc="/car-logos/toyota.png"
                            objectFit="contain"
                        />
                    </button>
                    {/* Status Dot - absolutely positioned outside button overflow */}
                    <span
                        className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 md:h-3 md:w-3 rounded-full ring-2 ring-white pointer-events-none",
                            isOnline ? "bg-green-500" : "bg-slate-400"
                        )}
                    />
                </div>

                {/* Company Name + Location - Vertically Split */}
                <div className="flex flex-col justify-between min-w-0 flex-1 h-11 md:h-[54px] py-0.5">
                    <button onClick={(e) => { e.stopPropagation(); handleViewDetails(); }} className="text-left py-0.5">
                        <h3 className="text-xs md:text-sm font-semibold text-slate-900 hover:text-primary leading-tight transition-colors capitalize">
                            {company.name}
                        </h3>
                    </button>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 leading-none pb-0.5">
                        <Icon icon="mdi:map-marker" className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                        <span className="truncate capitalize">{cityDisplay}</span>
                        {company.vipStatus && (
                            <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                                <Icon icon="mdi:crown" className="w-2 h-2" />
                                {t('catalog.card.vip', 'VIP')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Column 2: Rating (Fit Content) - Always Visible */}
            <div className="flex items-center justify-center border-l border-slate-100 pl-2 md:pl-4 h-full">
                <div className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                    <Icon icon="mdi:star" className="h-3 w-3 md:h-4 md:w-4 text-amber-400 fill-current" />
                    <span className="font-semibold text-xs md:text-sm text-slate-700">{company.rating}</span>
                    <span className="hidden md:inline text-xs text-slate-400">({company.reviewCount})</span>
                </div>
            </div>
        </div>
    );
});

CompanyRowItem.displayName = 'CompanyRowItem';
