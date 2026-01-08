import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

type PromoBanner = {
  id: string;
  icon: string;
  image: string;
  bgColor?: string;
  useGradient?: boolean;
  textDark?: boolean;
};

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'bid_anytime',
    icon: 'mdi:gavel',
    useGradient: true,
    image: '/cars/1.webp',
  },
  {
    id: 'daily_sales',
    icon: 'mdi:tag',
    useGradient: true,
    image: '/cars/2.webp',
  },
  {
    id: 'no_license',
    icon: 'mdi:card-remove',
    useGradient: true,
    image: '/cars/3.webp',
  },
  {
    id: 'bid_wins',
    icon: 'mdi:trophy',
    useGradient: true,
    image: '/cars/1.webp',
  },
];

export function PromoBannersSection() {
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
              className={`${banner.bgColor || ''} rounded-2xl p-4 relative overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow min-h-[140px]`}
              style={banner.useGradient ? {
                background: `linear-gradient(135deg, var(--hero-gradient-start) 0%, var(--hero-gradient-mid) 50%, var(--hero-gradient-end) 100%)`,
              } : undefined}
            >
              {/* Text */}
              <div className={banner.textDark ? 'text-primary' : 'text-white'}>
                <h3 className="text-base font-bold leading-snug mb-1">
                  {t(`home.promo_banners.${banner.id}.title`)}
                </h3>
                <p className={`text-xs leading-relaxed ${banner.textDark ? 'text-primary/70' : 'text-white/70'}`}>
                  {t(`home.promo_banners.${banner.id}.description`)}
                </p>
              </div>

              {/* Thematic icon instead of photo */}
              <div className="absolute bottom-2 right-2 rtl:left-2 rtl:right-auto">
                <Icon
                  icon={banner.icon}
                  className={`h-8 w-8 ${banner.textDark ? 'text-[#8a5a00]/85' : 'text-white/35'}`}
                  aria-hidden="true"
                  focusable="false"
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
