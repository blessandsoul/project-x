import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const PROMO_BANNERS = [
  {
    id: 'bid_anytime',
    icon: 'mdi:gavel',
    bgColor: 'bg-[#1a2744]',
    image: '/cars/1.webp',
  },
  {
    id: 'daily_sales',
    icon: 'mdi:tag',
    bgColor: 'bg-[#0047AB]',
    image: '/cars/2.webp',
  },
  {
    id: 'no_license',
    icon: 'mdi:card-remove',
    bgColor: 'bg-[#1a2744]',
    image: '/cars/3.webp',
  },
  {
    id: 'bid_wins',
    icon: 'mdi:trophy',
    bgColor: 'bg-[#f5a623]',
    image: '/cars/1.webp',
    textDark: true,
  },
];

export function PromoBannersSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.section
      className="py-10 bg-background"
      aria-labelledby="home-promo-banners-heading"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
        {/* Banners Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PROMO_BANNERS.map((banner) => (
            <div
              key={banner.id}
              className={`${banner.bgColor} rounded-2xl p-4 relative overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow min-h-[140px]`}
              onClick={() => navigate('/auction-listings')}
            >
              {/* Text */}
              <div className={banner.textDark ? 'text-[#1a2744]' : 'text-white'}>
                <h3 className="text-lg font-bold leading-tight">
                  {t(`home.promo_banners.${banner.id}.title`)}<br />
                  <span className={banner.textDark ? 'text-[#1a2744]/80' : 'text-[#f5a623]'}>
                    {t(`home.promo_banners.${banner.id}.subtitle`)}
                  </span>
                </h3>
              </div>

              {/* Thematic icon instead of photo */}
              <div className="absolute bottom-2 right-2 rtl:left-2 rtl:right-auto opacity-30">
                <Icon
                  icon={banner.icon}
                  className="w-10 h-10 md:w-12 md:h-12"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Follow Us Section */}
        <div className="mt-10 text-center">
          <h3
            id="home-promo-banners-heading"
            className="text-base font-semibold text-foreground mb-3"
          >
            {t('home.promo_banners.follow_us')}
          </h3>
          <div className="flex justify-center gap-3">
            {['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'].map((social) => (
              <button
                key={social}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label={social}
              >
                <Icon icon={`mdi:${social}`} className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
