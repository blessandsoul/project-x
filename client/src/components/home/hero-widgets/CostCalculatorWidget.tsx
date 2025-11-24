import { useCostCalculator } from '@/hooks/useCostCalculator';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react';

export function CostCalculatorWidget() {
  const { values, updateValue, breakdown } = useCostCalculator();

  if (!breakdown) return null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Icon icon="mdi:calculator" className="text-primary" />
          Import Calculator
        </h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Auction Price</label>
              <span className="font-mono font-bold text-slate-900">${values.auctionPrice}</span>
            </div>
            <Slider
              value={[values.auctionPrice]}
              onValueChange={([v]) => updateValue('auctionPrice', v)}
              min={500}
              max={50000}
              step={100}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Engine Volume (L)</label>
              <span className="font-mono font-bold text-slate-900">{values.engineVolume.toFixed(1)} L</span>
            </div>
            <Slider
              value={[values.engineVolume]}
              onValueChange={([v]) => updateValue('engineVolume', v)}
              min={0.8}
              max={6.0}
              step={0.1}
            />
          </div>
        </div>

        <Separator />

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Shipping to Poti/Batumi</span>
            <span>${breakdown.shipping}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Est. Customs Clearance</span>
            <span>${breakdown.customs}</span>
          </div>
          <div className="flex justify-between text-slate-600">
             <span>Broker & Port Fees</span>
             <span>${breakdown.brokerFee}</span>
          </div>
        </div>
        
        {/* Total */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
           <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-slate-600">Total Estimated Cost</span>
              <div className="text-right">
                 <span className="block text-2xl font-bold text-primary leading-none">
                    ${breakdown.total.toLocaleString()}
                 </span>
                 <span className="text-xs text-slate-400" aria-label="Approximate price in GEL">
                    ≈ {(breakdown.total * 2.7).toLocaleString()} GEL
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

