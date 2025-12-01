import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { navigationItems, footerLinks } from '@/config/navigation';
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
    <div className="min-h-screen flex flex-col bg-white pt-16">
      <Header
        user={null}
        navigationItems={navigationItems}
      />
      
      <main
        className="flex-1 flex flex-col"
        role="main"
        aria-label={t('vin.title')}
      >
        {/* Hero Section */}
        <section className="bg-white border-b py-12 lg:py-20">
            <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                        {t('vin.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('vin.subtitle')}
                    </p>
                </div>

                <Card className="border border-slate-100 shadow-xl bg-white relative overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
                    <CardContent className="p-2 sm:p-4">
                        <form
                            onSubmit={handleSubmit}
                            className="relative flex flex-col sm:flex-row gap-2"
                        >
                            <div className="relative flex-1 group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
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

                                        if (error) {
                                            reset();
                                        }

                                        setVin(nextValue);
                                    }}
                                    placeholder={t('vin.vin_placeholder')}
                                    className="h-12 pl-12 text-lg uppercase tracking-widest font-mono border-transparent bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                                    aria-invalid={!!error}
                                    aria-describedby={error ? 'vin-error' : undefined}
                                    maxLength={17}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || vin.length < 17}
                                size="lg"
                                className="h-12 px-8 font-semibold text-base shadow-sm hover:shadow-md transition-all"
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
                        </form>
                    </CardContent>
                </Card>
                
                <p className="text-xs text-muted-foreground">
                    {t(
                      'vin.vin_hint',
                      'Enter a 17-character VIN (letters A-Z except I, O, Q and digits 0-9).',
                    )}
                </p>

                {/* History Section */}
                {vinHistory.length > 0 && (
                    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <Icon icon="mdi:history" className="h-4 w-4" />
                            <span>{t('vin.recent_checks')}:</span>
                             <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
                                onClick={handleClearHistory}
                             >
                                {t('common.clear_all')}
                             </Button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {vinHistory.map((item) => (
                                <div key={item} className="group relative inline-flex items-center animate-in zoom-in-95 duration-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVin(item);
                                            if (error) reset();
                                        }}
                                        className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5 text-sm font-mono font-medium uppercase tracking-wide hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                    >
                                        {item}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleRemoveHistoryItem(item); 
                                        }}
                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground shadow-sm"
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
        </section>

        {/* Results Container */}
        <section className="container mx-auto px-4 max-w-6xl pb-20 space-y-8 flex-1">
            {/* Error State */}
            {error && (
                <div 
                    id="vin-error" 
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive flex items-center gap-3 animate-in shake"
                >
                    <Icon icon="mdi:alert-circle" className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !hasResult && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="border-none shadow-lg">
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
                    <p className="text-center text-sm text-muted-foreground animate-pulse">
                        {t('vin.loading_hint')}
                    </p>
                </div>
            )}

            {/* Empty State (Initial) */}
            {!hasResult && !error && !isLoading && (
                <div className="text-center py-12 opacity-40 select-none pointer-events-none">
                    <Icon icon="mdi:car-search" className="h-32 w-32 mx-auto text-muted-foreground/30 mb-6" />
                    <p className="text-lg font-medium text-muted-foreground">
                        {t('vin.empty_state_hint')}
                    </p>
                </div>
            )}

            {/* Actual Result */}
            <AnimatePresence mode="wait">
                {hasResult && result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <VinDecodeResultCard
                            vin={result.vin}
                            data={result.data}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
      </main>
      
      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default CarfaxPage;
