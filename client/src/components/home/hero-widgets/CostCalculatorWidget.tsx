import { useCostCalculator } from '@/hooks/useCostCalculator';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export function CostCalculatorWidget() {
  const { t } = useTranslation();
  const { values, updateValue, breakdown } = useCostCalculator();

  if (!breakdown) return null;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg shadow-xl border border-white/15 overflow-hidden w-full">
      <div className="bg-white/10 px-3 py-2 border-b border-white/10">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Icon icon="mdi:calculator" className="text-primary h-4 w-4" />
          {t('home.price_calculator.widget_title')}
        </h3>
      </div>
      
      <div className="p-3 space-y-3">
        {/* Inputs */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-white/60 uppercase">{t('home.price_calculator.auction_price')}</label>
            <span className="text-xs font-mono font-bold text-white">${values.auctionPrice}</span>
          </div>
          <Slider
            value={[values.auctionPrice]}
            onValueChange={([v]) => updateValue('auctionPrice', v)}
            min={500}
            max={50000}
            step={100}
          />
        </div>

        <Separator className="my-2" />

        {/* Breakdown */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-white/70">
            <span className="text-[11px]">{t('home.price_calculator.shipping_poti')}</span>
            <span className="text-[11px] font-medium">${breakdown.shipping}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span className="text-[11px]">{t('home.price_calculator.est_customs')}</span>
            <span className="text-[11px] font-medium">${breakdown.customs}</span>
          </div>
          <div className="flex justify-between text-white/70">
             <span className="text-[11px]">{t('home.price_calculator.broker_fees')}</span>
             <span className="text-[11px] font-medium">${breakdown.brokerFee}</span>
          </div>
        </div>
        
        {/* Total */}
        <div className="bg-primary/20 p-2.5 rounded-lg border border-primary/30">
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-medium text-white/70 uppercase">{t('home.price_calculator.total_estimated')}</span>
              <div className="text-right">
                 <span className="block text-lg font-bold text-white leading-none">
                    ${breakdown.total.toLocaleString()}
                 </span>
                 <span className="text-[9px] text-white/50" aria-label="Approximate price in GEL">
                    ≈ {(breakdown.total * 2.7).toLocaleString()} GEL
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

