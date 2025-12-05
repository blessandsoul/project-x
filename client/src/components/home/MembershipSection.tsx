import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MEMBERSHIP_PLANS = [
  {
    id: 'guest',
    color: 'text-green-600',
  },
  {
    id: 'basic',
    color: 'text-[#f5a623]',
    badge: 'promo',
  },
  {
    id: 'premier',
    color: 'text-[#f5a623]',
    badge: 'promo',
  },
];

const REGISTER_TYPE_BY_PLAN: Record<string, string> = {
  guest: 'user',
  basic: 'dealer',
  premier: 'company',
};

export function MembershipSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Get features array from translations
  const getFeatures = (planId: string): string[] => {
    const features = t(`home.membership.plans.${planId}.features`, { returnObjects: true });
    if (Array.isArray(features)) {
      return features.map(f => String(f));
    }
    return [];
  };

  return (
    <motion.section
      className="py-16 bg-background/95"
      aria-labelledby="home-membership-heading"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
        <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 space-y-3">
          <h2
            id="home-membership-heading"
            className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground text-balance"
          >
            {t('home.membership.title')}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-2xl mx-auto">
            {t('home.membership.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
          {MEMBERSHIP_PLANS.map((plan) => {
            const features = getFeatures(plan.id);
            const price = t(`home.membership.plans.${plan.id}.price`);
            const hasBadge = 'badge' in plan && plan.badge === 'promo';
            const registerType = REGISTER_TYPE_BY_PLAN[plan.id] ?? 'user';
            
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  navigate(`/register?type=${registerType}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/90 p-6 md:p-7 shadow-[0_16px_48px_rgba(15,23,42,0.16)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.22)] text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                {/* Promo badge for Dealer/Company */}
                {hasBadge && (
                  <div className="absolute -top-2 -right-2 rtl:-left-2 rtl:right-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    PROMO
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(`home.membership.plans.${plan.id}.name`)}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-3 mb-5">
                    <span className={cn('text-3xl md:text-4xl font-semibold', plan.color)}>{price}</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon icon="mdi:check" className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* No inner CTA button: whole card is clickable */}
              </button>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <Button
            className="px-8 h-10 md:h-11 rounded-full font-semibold bg-[#f5a623] hover:bg-[#e5a800] text-[#1a2744]"
            onClick={() => {
              navigate('/register?type=user');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {t('home.membership.register_now')}
          </Button>
        </div>
        </div>
      </div>
    </motion.section>
  );
}
