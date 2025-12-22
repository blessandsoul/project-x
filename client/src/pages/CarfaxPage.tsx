import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { motion, AnimatePresence } from 'framer-motion';

// Header and Footer are provided by MainLayout
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// navigationItems/footerLinks now handled by MainLayout
import { useVinDecode } from '@/hooks/useVinDecode';
import VinDecodeResultCard from '@/components/vin/VinDecodeResultCard';

const VIN_HISTORY_STORAGE_KEY = 'trustedimporters.vin.history';

const CarfaxPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [vin, setVin] = useState('');
  const [vinHistory, setVinHistory] = useState<string[]>([]);
  const [hasAutoSubmittedFromUrl, setHasAutoSubmittedFromUrl] = useState(false);
  const { isLoading, error, result, submit, reset } = useVinDecode();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit(vin);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(VIN_HISTORY_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setVinHistory(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // ignore history load errors
    }
  }, []);

  const handleClearHistory = () => {
    setVinHistory([]);

    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(VIN_HISTORY_STORAGE_KEY);
    } catch {
      // ignore history clear errors
    }
  };

  const handleRemoveHistoryItem = (value: string) => {
    setVinHistory((prev) => {
      const next = prev.filter((item) => item !== value);

      if (typeof window !== 'undefined') {
        try {
          if (next.length === 0) {
            window.localStorage.removeItem(VIN_HISTORY_STORAGE_KEY);
          } else {
            window.localStorage.setItem(VIN_HISTORY_STORAGE_KEY, JSON.stringify(next));
          }
        } catch {
          // ignore history update errors
        }
      }

      return next;
    });
  };

  useEffect(() => {
    const vinFromUrl = searchParams.get('vin');
    if (!vinFromUrl) return;

    let nextValue = vinFromUrl.toUpperCase();
    nextValue = nextValue.replace(/[IOQ]/gi, '');
    if (nextValue.length > 17) {
      nextValue = nextValue.slice(0, 17);
    }

    if (!nextValue) return;

    setVin(nextValue);

    if (!hasAutoSubmittedFromUrl && nextValue.length === 17) {
      void submit(nextValue);
      setHasAutoSubmittedFromUrl(true);
    }
  }, [searchParams, hasAutoSubmittedFromUrl, submit]);

  useEffect(() => {
    if (!result?.vin) return;
    if (typeof window === 'undefined') return;

    setVinHistory((prev) => {
      const nextWithoutCurrent = prev.filter((item) => item !== result.vin);
      const next = [result.vin, ...nextWithoutCurrent].slice(0, 5);

      try {
        window.localStorage.setItem(VIN_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore history save errors
      }

      return next;
    });
  }, [result?.vin]);

  const hasResult = !!result && !error;

  return (
    // Negative margin to pull hero under the fixed header (counteracts MainLayout padding)
    <div className="flex-1 flex flex-col -mt-14 lg:-mt-24">
      {/* Hero Section - Form-focused, full-width gradient */}
      <section className="vin-hero relative overflow-hidden">
        {/* Full-width hero gradient background */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gradient-hero-start)] via-[var(--gradient-hero-mid)] to-[var(--gradient-hero-end)] z-0"
        />

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 z-0" />

        {/* Atmospheric glow behind form area */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full z-0"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Hero Content - Centered, form-first */}
        <div className="vin-hero-inner relative z-10">
          <div className="w-full px-4 lg:px-8 max-w-3xl mx-auto pt-20 pb-10 md:pt-24 md:pb-14 lg:pt-32 lg:pb-16">
            {/* Single column, centered content */}
            <div className="space-y-6">
              {/* Title & Description - centered */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl lg:text-[44px] font-semibold leading-tight tracking-tight text-white">
                  {t('vin.title')}
                </h1>
                <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto">
                  {t('vin.subtitle')}
                </p>
              </div>

              {/* VIN Input Form - the focal point */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                      <Icon icon="mdi:barcode-scan" className="h-5 w-5" />
                    </div>
                    <Input
                      id="vin"
                      value={vin}
                      autoFocus
                      onChange={(event) => {
                        let nextValue = event.target.value.toUpperCase();
                        nextValue = nextValue.replace(/[IOQ]/gi, '');
                        if (nextValue.length > 17) {
                          nextValue = nextValue.slice(0, 17);
                        }
                        if (error) reset();
                        setVin(nextValue);
                      }}
                      placeholder={t('vin.vin_placeholder')}
                      className="h-14 pl-12 text-lg uppercase tracking-widest font-mono bg-white text-slate-900 border-0 shadow-lg focus:ring-2 focus:ring-white/30 placeholder:text-slate-400"
                      aria-invalid={!!error}
                      aria-describedby={error ? 'vin-error' : undefined}
                      maxLength={17}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || vin.length < 17}
                    size="lg"
                    className="h-14 px-10 font-semibold text-base bg-accent hover:bg-accent/90 text-[var(--gradient-hero-start)] shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Icon icon="mdi:loading" className="me-2 h-5 w-5 animate-spin" />
                        {t('vin.check_btn_loading', 'Checking...')}
                      </>
                    ) : (
                      t('vin.check_btn')
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/60 text-center">
                  {t('vin.vin_hint', 'Enter a 17-character VIN (letters A-Z except I, O, Q and digits 0-9).')}
                </p>
              </form>

              {/* Feature badges - subtle, centered */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:shield-check" className="w-4 h-4 text-white/50" />
                  <span>{t('vin.feature_accurate', 'Accurate Data')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:clock-fast" className="w-4 h-4 text-white/50" />
                  <span>{t('vin.feature_instant', 'Instant Results')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:file-document-check" className="w-4 h-4 text-white/50" />
                  <span>{t('vin.feature_detailed', 'Full Specs')}</span>
                </div>
              </div>

              {/* History Section - if exists */}
              {vinHistory.length > 0 && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                    <Icon icon="mdi:history" className="h-4 w-4" />
                    <span>{t('vin.recent_checks')}:</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-white/50 hover:text-red-400"
                      onClick={handleClearHistory}
                    >
                      {t('common.clear_all')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {vinHistory.map((item) => (
                      <div key={item} className="group relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setVin(item);
                            if (error) reset();
                          }}
                          className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-mono font-medium uppercase tracking-wide text-white/80 hover:bg-white/20 hover:border-white/25 transition-all"
                        >
                          {item}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveHistoryItem(item);
                          }}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                          aria-label={t('vin.remove_history_tooltip')}
                        >
                          <Icon icon="mdi:close" className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section - Clean white background */}
      <main className="flex-1 bg-slate-50" role="main" aria-label={t('vin.title')}>
        <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Error State */}
            {error && (
              <div
                id="vin-error"
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-3"
              >
                <Icon icon="mdi:alert-circle" className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !hasResult && (
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full max-w-md" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!hasResult && !error && !isLoading && (
              <div className="text-center py-16">
                <Icon icon="mdi:car-search" className="h-24 w-24 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-400">
                  {t('vin.empty_state_hint')}
                </p>
              </div>
            )}

            {/* Result */}
            <AnimatePresence mode="wait">
              {hasResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <VinDecodeResultCard vin={result.vin} data={result.data} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarfaxPage;
