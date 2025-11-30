import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { fetchCompaniesFromApi } from '@/services/companiesApi';

export function HeroCalculator() {
  const { t } = useTranslation();
  const [auctionPrice, setAuctionPrice] = useState<string>('5000');
  const [vin, setVin] = useState<string>('');
  const [result, setResult] = useState<number>(0);
  const [gelResult, setGelResult] = useState<number>(0);
  const [breakdown, setBreakdown] = useState({ shipping: 1500, customs: 0, fees: 500 });
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const price = parseInt(auctionPrice.replace(/[^0-9]/g, '') || '0', 10);
    
    // Simple estimation logic
    const shipping = 1500;
    const fees = 500;
    const customs = price * 0.18; // Approx VAT + Duty
    
    const total = price + shipping + fees + customs;
    
    setBreakdown({ shipping, fees, customs: Math.round(customs) });
    setResult(Math.round(total));
    setGelResult(Math.round(total * 2.7));
  }, [auctionPrice]);

  useEffect(() => {
    let isCancelled = false;

    const loadCompanyCount = async () => {
      try {
        const companies = await fetchCompaniesFromApi();
        if (!isCancelled) {
          setCompanyCount(Array.isArray(companies) ? companies.length : 0);
        }
      } catch (error) {
        console.error('[HeroCalculator] Failed to load company count', error);
        if (!isCancelled) {
          setCompanyCount(null);
        }
      }
    };

    void loadCompanyCount();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="relative bg-white/5 backdrop-blur-2xl p-4 rounded-xl shadow-lg border border-white/20 overflow-hidden">
      {/* Overlay label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
        <span className="px-4 py-2 rounded-full bg-black/60 text-white text-xs font-semibold tracking-wide uppercase">
          Coming Soon!
        </span>
      </div>

      {/* Blurred content */}
      <div className="space-y-3 opacity-30 blur-sm md:blur pointer-events-none select-none">
        
        {/* VIN / Price Input Toggle could go here, but sticking to requirements: Calc + VIN */}
        
        <div className="grid gap-3 md:grid-cols-2">
            {/* 1. Price Input */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase">
                  {t('home.price_calculator.auction_price')}
                </label>
                <div className="relative">
                    <Icon icon="mdi:currency-usd" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        value={auctionPrice}
                        onChange={(e) => setAuctionPrice(e.target.value)}
                        className="pl-9 h-10 text-base font-bold bg-slate-50 border-slate-200 focus:ring-primary"
                        placeholder="5000"
                        type="number"
                    />
                </div>
            </div>

             {/* 2. VIN Input */}
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase">
                  {t('vehicle.specs.vin')}
                </label>
                <div className="relative">
                    <Icon icon="mdi:barcode-scan" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        className="pl-9 h-10 font-mono text-sm uppercase bg-slate-50 border-slate-200 focus:ring-primary"
                        placeholder="1HGCM..."
                        maxLength={17}
                    />
                </div>
            </div>
        </div>

        {/* Result Summary */}
        <div className="rounded-lg p-3 text-white bg-emerald-600">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">
                  {t('auction.estimated_total')}
                </span>
                <span className="text-[10px] font-medium text-slate-900 bg-white/30 px-1.5 py-0.5 rounded">
                  {t('auction.customs')} &amp; {t('auction.shipping')}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-white">${result.toLocaleString()}</span>
                <span className="text-base font-medium text-emerald-100">≈ {gelResult.toLocaleString()} ₾</span>
            </div>
            
            {/* Mini Breakdown */}
            <div className="mt-2 pt-2 border-t border-emerald-800/40 flex justify-between text-[10px] text-emerald-100">
                <span>{t('auction.shipping')}: ${breakdown.shipping}</span>
                <span>{t('auction.customs')}: ~${breakdown.customs}</span>
                <span>{t('auction.fees')}: ${breakdown.fees}</span>
            </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
            <Button 
                size="default" 
                className="w-full h-10 text-sm font-bold text-slate-900 shadow-md bg-gradient-to-r from-[#FFA500] via-[#FFB347] to-[#FF8C00] hover:from-[#ffb027] hover:via-[#ff9a1a] hover:to-[#ff7a00]"
                onClick={() => navigate('/catalog')}
            >
                {t('auction.calculate_cost')}
            </Button>
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Icon icon="mdi:check-decagram" className="text-green-600 h-3 w-3" />
                {companyCount !== null
                  ? t('home.hero.verified_companies', { count: companyCount })
                  : t('home.hero.verified_companies', { count: 14 })}
            </div>
        </div>

      </div>
    </div>
  );
}

