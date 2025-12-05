import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { searchVehicles } from '@/api/vehicles';
import type { SearchVehiclesResponse, VehicleSearchItem } from '@/types/vehicles';

type SimpleVehicleCard = {
  id: number | string;
  title: string;
  image: string;
};

export function WhatIsCopartSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<SimpleVehicleCard[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadRandomVehicles = async () => {
      try {
        // Fetch a small pool and then pick 3 random
        const res: SearchVehiclesResponse = await searchVehicles({ limit: 12 });
        const items = (res.items ?? []) as VehicleSearchItem[];

        if (!isMounted || items.length === 0) return;

        const shuffled = [...items].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 3).map((item, index) => {
          const id = item.vehicle_id ?? item.id ?? index;
          const year = typeof item.year === 'number' ? item.year : undefined;
          const make = item.make ?? '';
          const model = item.model ?? '';
          const titleParts = [year, make, model].filter(Boolean);

          const image =
            item.primary_photo_url ||
            item.primary_thumb_url ||
            '/cars/1.webp';

          return {
            id,
            title: titleParts.join(' '),
            image,
          };
        });

        setVehicles(picked);
      } catch {
        if (!isMounted) return;
        // graceful fallback: no vehicles
        setVehicles([]);
      }
    };

    void loadRandomVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.section
      className="py-12 bg-slate-900 text-white"
      aria-labelledby="home-what-is-copart-heading"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] gap-8 items-start">
          {/* Left: Text Content */}
          <div className="space-y-4">
            <h2
              id="home-what-is-copart-heading"
              className="text-xl md:text-2xl font-semibold text-[#f5a623] text-balance tracking-tight"
            >
              {t('home.what_is_copart.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-white/80 max-w-xl">
              <p>{t('home.what_is_copart.description1')}</p>
              <p>{t('home.what_is_copart.description2')}</p>
            </div>
            <Button 
              size="sm"
              className="bg-[#f5a623] hover:bg-[#e5a800] text-slate-900 font-semibold text-xs rounded-full px-4"
              onClick={() => navigate('/auction-listings')}
            >
              {t('home.what_is_copart.learn_more')}
            </Button>
          </div>

          {/* Right: Random Vehicles from Auctions */}
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">
              {t('home.what_is_copart.browse_categories')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="relative rounded-xl overflow-hidden cursor-pointer group aspect-[4/3] border border-white/10 bg-black/20"
                  onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                >
                  <img
                    src={vehicle.image}
                    alt={vehicle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 rtl:left-auto rtl:right-2">
                    <h3 className="text-xs font-semibold text-white line-clamp-2">
                      {vehicle.title || t('common.cars')}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
