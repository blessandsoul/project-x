import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    id: 'search',
    icon: 'mdi:magnify',
    titleKey: 'home.how_it_works.steps.search.title',
    descKey: 'home.how_it_works.steps.search.description',
  },
  {
    id: 'compare',
    icon: 'mdi:compare',
    titleKey: 'home.how_it_works.steps.compare.title',
    descKey: 'home.how_it_works.steps.compare.description',
  },
  {
    id: 'choose',
    icon: 'mdi:check-circle',
    titleKey: 'home.how_it_works.steps.choose.title',
    descKey: 'home.how_it_works.steps.choose.description',
  },
  {
    id: 'import',
    icon: 'mdi:truck-delivery',
    titleKey: 'home.how_it_works.steps.import.title',
    descKey: 'home.how_it_works.steps.import.description',
  },
];

export function HowItWorksSlide() {
  const { t } = useTranslation();

  return (
    <section
      id="home-how-it-works-section"
      className="relative min-h-screen flex items-center justify-center py-10 md:py-16"
      aria-labelledby="home-how-it-works-heading"
    >
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{t('home.how_it_works.badge')}</span>
          </div>
          <h2
            id="home-how-it-works-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl"
          >
            {t('home.how_it_works.title')}
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl">
            {t('home.how_it_works.subtitle')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-lg">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
                <Icon icon={step.icon} className="h-8 w-8" aria-hidden="true" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-white">
                {t(step.titleKey)}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/70 leading-relaxed">
                {t(step.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
