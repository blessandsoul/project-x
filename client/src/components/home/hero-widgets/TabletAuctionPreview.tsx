import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { searchVehicles } from '@/api/vehicles';
import type { VehicleSearchItem } from '@/types/vehicles';

export function TabletAuctionPreview() {
  const [vehicles, setVehicles] = useState<VehicleSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const result = await searchVehicles({
          limit: 6,
          page: 1
        });
        setVehicles(result.items.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Icon icon="mdi:car" className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Live Auctions</h1>
              <p className="text-[10px] text-slate-500">Find your next car</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Icon icon="mdi:filter-variant" className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <button className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Icon icon="mdi:heart-outline" className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <input 
            type="text"
            placeholder="Search by make, model, VIN..."
            className="w-full h-8 bg-slate-50 rounded-lg pl-8 pr-2.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {vehicles.map((vehicle) => (
            <div 
              key={vehicle.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img 
                  src={vehicle.primary_photo_url || vehicle.primary_thumb_url || '/cars/1.webp'} 
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {vehicle.status === 'SOLD' && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded-md flex items-center gap-1">
                    <Icon icon="mdi:gavel" className="h-3 w-3" />
                    SOLD
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-2">
                <div className="mb-1">
                  <h3 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex items-center gap-0.5 text-[9px] text-slate-500 mt-0.5">
                    <Icon icon="mdi:map-marker" className="h-2.5 w-2.5" />
                    <span className="truncate">{vehicle.yard_name || vehicle.source || 'Auction'}</span>
                  </div>
                </div>

                {/* Stats Grid - All vehicle info */}
                <div className="grid grid-cols-2 gap-1 mb-1.5">
                  <div className="flex items-center gap-0.5 text-[8px]">
                    <Icon icon="mdi:speedometer" className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-slate-600 font-medium">{vehicle.mileage ? `${(vehicle.mileage / 1000).toFixed(0)}k mi` : '45k mi'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px]">
                    <Icon icon="mdi:palette" className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-slate-600 font-medium truncate">{vehicle.color || 'Black'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px]">
                    <Icon icon="mdi:engine" className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-slate-600 font-medium truncate">{vehicle.engine_fuel || '2.5L I4'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px]">
                    <Icon icon="mdi:car-shift-pattern" className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-slate-600 font-medium truncate">{vehicle.transmission || 'Automatic'}</span>
                  </div>
                </div>

                {/* Damage Info */}
                {vehicle.damage_main_damages && (
                  <div className="mb-1.5">
                    <div className="flex items-center gap-0.5 text-[8px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      <Icon icon="mdi:alert-circle" className="h-2.5 w-2.5" />
                      <span className="font-medium truncate">{vehicle.damage_main_damages}</span>
                    </div>
                  </div>
                )}

                {/* Prices */}
                <div className="space-y-1 mb-1.5">
                  {/* Current Bid / Retail Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 uppercase font-semibold">Current Bid</span>
                    <span className="text-xs font-extrabold text-slate-900">${(vehicle.calc_price || vehicle.retail_value || 0).toLocaleString()}</span>
                  </div>
                  
                  {/* Buy Now Price */}
                  {vehicle.buy_it_now_price && Number(vehicle.buy_it_now_price) > 0 && (
                    <div className="flex items-center justify-between bg-primary/10 px-1.5 py-0.5 rounded">
                      <span className="text-[8px] text-primary uppercase font-semibold">Buy Now</span>
                      <span className="text-xs font-extrabold text-primary">${Number(vehicle.buy_it_now_price).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button className="w-full py-1 bg-primary text-white text-[9px] font-bold rounded-md hover:bg-primary/90 transition-colors">
                  Join Live Auction
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
