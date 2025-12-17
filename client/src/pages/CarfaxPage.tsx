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
    <div className="flex-1 flex flex-col">
      {/* Hero Section - Yellow diagonal background like CopartHeroSection */}
      <section className="vin-hero relative overflow-hidden bg-gradient-to-b from-background via-background to-background/95">
        {/* Yellow diagonal background shape */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[64%] bg-accent z-0"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)',
          }}
        />
        
        {/* Subtle texture overlay */}
        <div className="vin-hero-overlay absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 mix-blend-soft-light" />

        {/* Hero Content */}
        <div className="vin-hero-inner relative z-10">
          <div className="vin-hero-container w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto pt-12 pb-10 md:pt-16 md:pb-12 lg:pt-20 lg:pb-14">
            <div className="vin-hero-grid grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column - Text & Form */}
              <div className="vin-hero-content space-y-6 text-slate-900 max-w-xl">
                <h1 className="text-3xl md:text-4xl lg:text-[42px] font-semibold leading-tight tracking-tight">
                  {t('vin.title')}
                </h1>
                <p className="text-base md:text-lg text-slate-700/90 max-w-lg">
                  {t('vin.subtitle')}
                </p>

                {/* VIN Input Form */}
                <form onSubmit={handleSubmit} className="vin-hero-form space-y-3">
                  <div className="vin-hero-form-row flex flex-col sm:flex-row gap-2">
                    <div className="vin-hero-input-wrapper relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
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
                        className="h-14 pl-12 text-lg uppercase tracking-widest font-mono bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-slate-900/20"
                        aria-invalid={!!error}
                        aria-describedby={error ? 'vin-error' : undefined}
                        maxLength={17}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || vin.length < 17}
                      size="lg"
                      className="h-14 px-8 font-semibold text-base bg-slate-900 hover:bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.35)]"
                    >
                      {isLoading ? (
                        <>
                          <Icon icon="mdi:loading" className="me-2 h-5 w-5 animate-spin" />
                          {t('vin.check_btn_loading', 'Checking...')}
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:magnify" className="me-2 h-5 w-5" />
                          {t('vin.check_btn')}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="vin-hero-hint text-xs text-slate-600">
                    {t('vin.vin_hint', 'Enter a 17-character VIN (letters A-Z except I, O, Q and digits 0-9).')}
                  </p>
                </form>

                {/* Feature Icons */}
                <div className="vin-hero-features flex flex-wrap items-center gap-4 pt-2 text-xs md:text-sm text-slate-800">
                  <div className="vin-hero-feature inline-flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                      <Icon icon="mdi:shield-check" className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{t('vin.feature_accurate', 'Accurate Data')}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                      <Icon icon="mdi:clock-fast" className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{t('vin.feature_instant', 'Instant Results')}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                      <Icon icon="mdi:file-document-check" className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{t('vin.feature_detailed', 'Full Specs')}</span>
                  </div>
                </div>

                {/* History Section */}
                {vinHistory.length > 0 && (
                  <div className="vin-hero-recent pt-2 space-y-2">
                    <div className="vin-hero-recent-header flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Icon icon="mdi:history" className="h-4 w-4" />
                      <span>{t('vin.recent_checks')}:</span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-slate-500 hover:text-red-600"
                        onClick={handleClearHistory}
                      >
                        {t('common.clear_all')}
                      </Button>
                    </div>
                    <div className="vin-hero-recent-chips flex flex-wrap gap-2">
                      {vinHistory.map((item) => (
                        <div key={item} className="group relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setVin(item);
                              if (error) reset();
                            }}
                            className="flex items-center gap-2 rounded-lg bg-white/80 border border-slate-200 px-3 py-1.5 text-xs font-mono font-medium uppercase tracking-wide hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                          >
                            {item}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHistoryItem(item);
                            }}
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-200 text-slate-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white shadow-sm"
                            aria-label={t('vin.remove_history_tooltip')}
                          >
                            <Icon icon="mdi:close" className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tablet-only car illustration card (stacked layout 768–1024px) */}
                <div className="vin-hero-tablet-card hidden md:block lg:hidden pt-6">
                  <div className="max-w-md mx-auto">
                    <div className="relative w-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-transparent rounded-3xl" />
                      <Icon icon="mdi:car-info" className="w-full h-56 text-slate-900/20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Decorative car image (desktop only) */}
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-transparent rounded-3xl" />
                  <Icon icon="mdi:car-info" className="w-full h-64 text-slate-900/20" />
                </div>
              </div>
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
