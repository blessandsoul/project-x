import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAKES = [
  'Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 'Jeep',
  'Hyundai', 'Kia', 'Ram', 'Subaru', 'GMC', 'Volkswagen',
  'BMW', 'Mercedes-Benz', 'Mazda', 'Lexus', 'Dodge', 'Audi',
  'Tesla', 'Volvo', 'Cadillac', 'Buick', 'Chrysler', 'Acura',
  'Infiniti', 'Lincoln', 'Land Rover', 'Porsche', 'Jaguar', 'Aston Martin',
];

export function VehicleCatalogLinksSection() {
  const { t } = useTranslation();
  const activeTab = 'makes';

  return (
    <motion.section
      className="py-10 bg-background"
      aria-labelledby="home-vehicle-catalog-heading"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
        <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,280px)] gap-6 items-start">
          {/* Left: Links Grid */}
          <div>
            <h2
              id="home-vehicle-catalog-heading"
              className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-2 text-balance"
            >
              {t('home.vehicle_catalog.title')}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground max-w-2xl">
              {t('home.vehicle_catalog.subtitle')}
            </p>

            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b border-border/60 text-sm">
              <button
                className={cn(
                  'pb-2 text-xs md:text-sm font-medium transition-colors -mb-px border-b-2 border-transparent',
                  activeTab === 'makes'
                    ? 'text-foreground border-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('home.vehicle_catalog.tabs.makes')}
              </button>
            </div>

            {/* Links */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {MAKES.map((item) => {
                const logoPath = `/car-logos/${item.toLowerCase().replace(/ /g, '-')}.png`;
                return (
                  <Link
                    key={item}
                    to={`/auction-listings?q=${encodeURIComponent(item)}`}
                    className="flex items-center justify-center p-2 rounded-lg border border-border/40 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all group aspect-square"
                    title={item}
                  >
                    <img
                      src={logoPath}
                      alt={item}
                      className="w-full h-full object-contain transition-all duration-300"
                      loading="lazy"
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Promo Banner */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col justify-between relative overflow-hidden p-5 shadow-[0_16px_48px_rgba(15,23,42,0.4)]">
            <div>
              <h3 className="text-2xl font-semibold leading-tight tracking-tight">
                {t('home.vehicle_catalog.promo.title_line1')}<br />
                {t('home.vehicle_catalog.promo.title_line3')}
              </h3>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-accent text-primary px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                <Icon icon="mdi:card-account-details-outline" className="w-3.5 h-3.5" />
                {t('home.vehicle_catalog.promo.badge')}
              </div>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-full px-4"
              >
                {t('home.vehicle_catalog.promo.button')}
                <Icon icon="mdi:arrow-right" className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:rotate-180" />
              </Button>
            </div>
            {/* Thematic icon overlay instead of mock photo */}
            <div className="pointer-events-none absolute -bottom-2 -right-2 rtl:-left-2 rtl:right-auto opacity-40">
              <Icon icon="mdi:car" className="w-12 h-12" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
