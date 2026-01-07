import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

export function WhatIsCopartSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
              className="text-xl md:text-2xl font-semibold text-accent text-balance tracking-tight"
            >
              {t('home.what_is_copart.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-white/80 max-w-xl">
              <p>{t('home.what_is_copart.description1')}</p>
              <p>{t('home.what_is_copart.description2')}</p>
            </div>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-slate-900 font-semibold text-xs rounded-full px-4"
              onClick={() => navigate('/auction-listings')}
            >
              {t('home.what_is_copart.learn_more')}
            </Button>
          </div>

          {/* Right: 4-Icon Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Feature 1: Easy Search */}
            <Link
              to="/companies"
              className="flex flex-col items-center justify-center p-5 bg-[#0F1A35] rounded-xl text-white shadow-sm border border-white/5 hover:bg-[#1A2542] transition-colors"
            >
              <Icon icon="mdi:magnify" className="h-8 w-8 mb-2 text-accent" aria-hidden="true" />
              <h4 className="font-semibold text-sm">{t('home.what_is_copart.features.search_title')}</h4>
              <p className="text-xs opacity-70 text-center mt-1">
                {t('home.what_is_copart.features.search_desc')}
              </p>
            </Link>

            {/* Feature 2: Compare */}
            <Link
              to="/auction-listings"
              className="flex flex-col items-center justify-center p-5 bg-[#0F1A35] rounded-xl text-white shadow-sm border border-white/5 hover:bg-[#1A2542] transition-colors"
            >
              <Icon icon="mdi:scale-balance" className="h-8 w-8 mb-2 text-accent" aria-hidden="true" />
              <h4 className="font-semibold text-sm">{t('home.what_is_copart.features.compare_title')}</h4>
              <p className="text-xs opacity-70 text-center mt-1">
                {t('home.what_is_copart.features.compare_desc')}
              </p>
            </Link>

            {/* Feature 3: Full Calculation */}
            <Link
              to="/catalog"
              className="flex flex-col items-center justify-center p-5 bg-[#0F1A35] rounded-xl text-white shadow-sm border border-white/5 hover:bg-[#1A2542] transition-colors"
            >
              <Icon icon="mdi:calculator-variant" className="h-8 w-8 mb-2 text-accent" aria-hidden="true" />
              <h4 className="font-semibold text-sm">{t('home.what_is_copart.features.calculate_title')}</h4>
              <p className="text-xs opacity-70 text-center mt-1">
                {t('home.what_is_copart.features.calculate_desc')}
              </p>
            </Link>

            {/* Feature 4: Trusted Reviews */}
            <Link
              to="/"
              className="flex flex-col items-center justify-center p-5 bg-[#0F1A35] rounded-xl text-white shadow-sm border border-white/5 hover:bg-[#1A2542] transition-colors"
            >
              <Icon icon="mdi:star-outline" className="h-8 w-8 mb-2 text-accent" aria-hidden="true" />
              <h4 className="font-semibold text-sm">{t('home.what_is_copart.features.reviews_title')}</h4>
              <p className="text-xs opacity-70 text-center mt-1">
                {t('home.what_is_copart.features.reviews_desc')}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
