import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export function SimpleCalculator() {
  const [auctionPrice, setAuctionPrice] = useState<string>('5000');
  const [result, setResult] = useState<number>(8200);
  const [gelResult, setGelResult] = useState<number>(22140);
  const navigate = useNavigate();

  // Simplified calculation logic for instant feedback
  useEffect(() => {
    const price = parseInt(auctionPrice.replace(/[^0-9]/g, '') || '0', 10);
    
    // Avg shipping ($1500) + Avg Customs (~30% for common cars) + Fees ($500)
    // This is a heuristics-based estimation for immediate value prop
    const shipping = 1500;
    const fees = 500;
    const estimatedCustoms = price * 0.25; 
    
    const total = price + shipping + fees + estimatedCustoms;
    
    setResult(Math.round(total));
    setGelResult(Math.round(total * 2.7));
  }, [auctionPrice]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 w-full max-w-md mx-auto">
      <div className="space-y-6">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Auction Price ($)
          </label>
          <div className="relative">
             <Icon icon="mdi:currency-usd" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6" />
             <Input 
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
                className="pl-12 h-14 text-2xl font-bold text-slate-900 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary"
                type="number"
             />
          </div>
        </div>

        {/* Result Display */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center space-y-1">
           <p className="text-xs font-bold text-green-700 uppercase">Total Estimated Cost</p>
           <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                 ${result.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500">
                 ≈ {gelResult.toLocaleString()} GEL (w/ Customs)
              </span>
           </div>
        </div>

        {/* CTA */}
        <Button 
           size="lg" 
           className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
           onClick={() => navigate('/catalog')}
        >
           Show Verified Companies
        </Button>
        
        <div className="text-center">
           <button onClick={() => navigate('/vin')} className="text-sm font-medium text-primary hover:underline inline-flex items-center">
              <Icon icon="mdi:barcode-scan" className="mr-1.5 h-4 w-4" />
              Check Price by VIN instead
           </button>
        </div>
      </div>
    </div>
  );
}

