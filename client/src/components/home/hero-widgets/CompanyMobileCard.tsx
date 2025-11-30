import { Icon } from '@iconify/react';
import type { Company } from '@/types/api';

interface CompanyMobileCardProps {
  company: Company;
}

export function CompanyMobileCard({ company }: CompanyMobileCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-3">
        {/* Logo - fully rounded */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full border border-slate-100 bg-white shadow-sm overflow-hidden">
            <img 
              src={company.logo || '/car-logos/toyota.png'} 
              alt={company.name} 
              className="h-full w-full object-cover" 
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Company Name */}
          <h3 className="font-bold text-sm text-slate-900 mb-1.5 line-clamp-1">
            {company.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 w-fit">
            <Icon icon="mdi:star" className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold text-xs text-slate-900">{company.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">({company.reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
