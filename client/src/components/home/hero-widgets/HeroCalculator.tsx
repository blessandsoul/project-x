import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { fetchCompaniesFromApi } from '@/services/companiesApi';

export function HeroCalculator() {
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
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <div className="space-y-5">
        
        {/* VIN / Price Input Toggle could go here, but sticking to requirements: Calc + VIN */}
        
        <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Price Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Auction Price ($)</label>
                <div className="relative">
                    <Icon icon="mdi:currency-usd" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        value={auctionPrice}
                        onChange={(e) => setAuctionPrice(e.target.value)}
                        className="pl-9 h-12 text-lg font-bold bg-slate-50 border-slate-200 focus:ring-primary"
                        placeholder="5000"
                        type="number"
                    />
                </div>
            </div>

             {/* 2. VIN Input (Optional) */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">VIN (Optional)</label>
                <div className="relative">
                    <Icon icon="mdi:barcode-scan" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        className="pl-9 h-12 font-mono uppercase bg-slate-50 border-slate-200 focus:ring-primary"
                        placeholder="1HGCM..."
                        maxLength={17}
                    />
                </div>
            </div>
        </div>

        {/* Result Summary */}
        <div className="bg-slate-900 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Estimated Total</span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Includes Customs & Shipping</span>
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold tracking-tight">${result.toLocaleString()}</span>
                <span className="text-lg font-medium text-slate-400">≈ {gelResult.toLocaleString()} ₾</span>
            </div>
            
            {/* Mini Breakdown */}
            <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-xs text-slate-400">
                <span>Shipping: ${breakdown.shipping}</span>
                <span>Customs: ~${breakdown.customs}</span>
                <span>Fees: ${breakdown.fees}</span>
            </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
            <Button 
                size="lg" 
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-md"
                onClick={() => navigate('/catalog')}
            >
                Show Verified Companies & Prices
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <Icon icon="mdi:check-decagram" className="text-green-600" />
                {companyCount !== null
                  ? `${companyCount} verified companies · Prices calculated instantly`
                  : 'Verified companies · Prices calculated instantly'}
            </div>
        </div>

      </div>
    </div>
  );
}

