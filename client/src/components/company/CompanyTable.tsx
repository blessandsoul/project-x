import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { CompanyRating } from './CompanyRating';
import { Image } from '@/components/ui/image';
import { useNavigate } from 'react-router-dom';
import type { Company } from '@/types/api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompanyTableProps {
  companies: Company[];
}

export function CompanyTable({ companies }: CompanyTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[280px] font-bold text-slate-700">Company</TableHead>
              <TableHead className="font-bold text-slate-700">Total Cost (Est.)</TableHead>
              <TableHead className="font-bold text-slate-700 hidden md:table-cell">Timeline</TableHead>
              <TableHead className="font-bold text-slate-700">Rating</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="group hover:bg-slate-50 transition-colors">
                {/* 1. Company Info */}
                <TableCell className="align-top py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg border border-slate-100 bg-white overflow-hidden shrink-0">
                      <Image 
                         src={company.logo ?? ''} 
                         alt={company.name} 
                         className="h-full w-full object-contain" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                         <span className="font-bold text-slate-900 text-base">{company.name}</span>
                         {company.vipStatus && (
                            <Tooltip>
                               <TooltipTrigger>
                                  <Icon icon="mdi:check-decagram" className="h-4 w-4 text-blue-500" />
                               </TooltipTrigger>
                               <TooltipContent>Verified: License + 5 reviews</TooltipContent>
                            </Tooltip>
                         )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mt-0.5">
                         <Icon icon="mdi:map-marker" className="h-3 w-3 mr-0.5" />
                         {company.location?.city || 'Tbilisi'}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Total Cost (Primary Value) */}
                <TableCell className="align-top py-4">
                  <div className="flex flex-col">
                     <span className="font-extrabold text-slate-900 text-base" aria-label={`Estimated cost from ${company.priceRange?.min} USD`}>
                        ${company.priceRange?.min?.toLocaleString()} - ${company.priceRange?.max?.toLocaleString()}
                     </span>
                     <span className="text-xs text-slate-500">≈ {(company.priceRange?.min! * 2.7).toLocaleString()} GEL</span>
                  </div>
                </TableCell>

                {/* 3. Timeline (Hidden on Mobile) */}
                <TableCell className="hidden md:table-cell align-top py-4">
                   <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                      45-60 days
                   </span>
                </TableCell>

                {/* 4. Rating */}
                <TableCell className="align-top py-4">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{company.rating}</span>
                        <CompanyRating rating={company.rating} showValue={false} className="h-3.5" />
                     </div>
                     <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                        {company.reviewCount} reviews
                     </span>
                  </div>
                </TableCell>

                {/* 5. Action CTA */}
                <TableCell className="text-right align-top py-4">
                  <Button 
                     size="sm" 
                     onClick={() => navigate(`/company/${company.id}`)}
                     className="bg-primary hover:bg-primary/90 text-white font-bold shadow-sm whitespace-nowrap"
                  >
                     Get Quote
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile List View (Simplified) */}
      <div className="md:hidden space-y-3">
        {companies.map((company) => (
          <div 
            key={company.id}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={() => navigate(`/company/${company.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg border border-slate-100 bg-white overflow-hidden shrink-0">
                    <Image 
                       src={company.logo ?? ''} 
                       alt={company.name} 
                       className="h-full w-full object-contain" 
                    />
                  </div>
                  <div>
                     <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900">{company.name}</span>
                        {company.vipStatus && <Icon icon="mdi:check-decagram" className="h-4 w-4 text-blue-500" />}
                     </div>
                     <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Icon icon="mdi:star" className="h-3 w-3" />
                        {company.rating} ({company.reviewCount})
                     </div>
                  </div>
               </div>
               <div className="text-right">
                  <span className="block font-extrabold text-slate-900 text-lg leading-none">
                     ${company.priceRange?.min?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">Service Fee</span>
               </div>
            </div>
            
            <Button className="w-full h-10 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 font-bold">
               Get Quote
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
