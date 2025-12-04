import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface VehicleHeaderBarProps {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  lotId?: string | number | null;
  vin?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationName?: string | null;
}

const VehicleHeaderBar = ({
  year,
  make,
  model,
  lotId,
  vin,
  locationCity,
  locationState,
  locationName,
}: VehicleHeaderBarProps) => {
  const navigate = useNavigate();

  return (
    <header className="space-y-2 mb-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-0 h-auto text-[#0047AB] text-[13px] font-medium hover:underline"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Back to results
        </Button>
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900 uppercase">
            {locationCity || 'Seattle'}, {locationState || 'WA'}
          </div>
          <div className="text-[11px] text-slate-500">{locationName || 'Seattle - North'}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0047AB] uppercase">
          {year} {make} {model}
        </h1>
        <div className="bg-green-100 text-green-800 text-[11px] font-bold px-2 py-1 rounded uppercase border border-green-300">
          Run and Drive
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
        {lotId && <span>Lot# {lotId}</span>}
        {lotId && vin && <span>•</span>}
        {vin && <span>{vin}</span>}
      </div>
    </header>
  );
};

export default VehicleHeaderBar;
