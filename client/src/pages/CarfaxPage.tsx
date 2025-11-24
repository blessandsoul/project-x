import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react/dist/iconify.js';
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
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={navigationItems}
      />
      <main
        className="flex-1"
        role="main"
        aria-label={t('vin.title')}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6 flex flex-col">
          <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">{t('vin.title')}</h1>
            <p className="text-muted-foreground">
              {t('vin.subtitle')}
            </p>
          </div>

          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">{t('vin.check_card_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="vin"
                    className="text-sm font-medium"
                  >
                    {t('vin.vin_label')}
                  </label>
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
                    className="uppercase tracking-[0.1em]"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'vin-error' : undefined}
                    maxLength={17}
                  />
                  {error && (
                    <p
                      id="vin-error"
                      className="text-xs text-red-600"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'vin.vin_hint',
                      'Enter a 17-character VIN (letters A-Z except I, O, Q and digits 0-9).',
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                        {t('vin.check_btn_loading', 'Checking VIN...')}
                      </>
                    ) : (
                      <>
                        <Icon icon="mdi:magnify" className="me-2 h-4 w-4" />
                        {t('vin.check_btn')}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading && !vin}
                    onClick={() => {
                      setVin('');
                      reset();
                    }}
                  >
                    <Icon icon="mdi:close" className="me-2 h-4 w-4" />
                    {t('vin.reset_btn', 'Clear')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {vinHistory.length > 0 && (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  {t('vin.history_title', 'Recent VIN checks')}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[0.7rem] text-muted-foreground"
                  onClick={handleClearHistory}
                >
                  <Icon icon="mdi:trash-can-outline" className="me-1 h-3 w-3" />
                  {t('vin.history_clear', 'Clear')}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground">
                  {t('vin.history_hint', 'Click on a VIN to reuse it in the form.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {vinHistory.map((item) => (
                    <div
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] bg-background"
                    >
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => {
                          setVin(item);
                          if (error) {
                            reset();
                          }
                        }}
                      >
                        {item}
                      </button>
                      <button
                        type="button"
                        className="text-[0.7rem] text-muted-foreground hover:text-foreground"
                        aria-label={t('vin.history_item_remove', 'Remove VIN from history')}
                        onClick={() => handleRemoveHistoryItem(item)}
                      >
                        <Icon icon="mdi:close" className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hasResult && !error && !isLoading && (
            <Card className="border-dashed border-muted w-full max-w-2xl mx-auto">
              <CardContent className="py-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
                <span>
                  {t(
                    'vin.empty_info',
                    'Enter a 17-character VIN to see vehicle details and find import companies.',
                  )}
                </span>
              </CardContent>
            </Card>
          )}

          {isLoading && !hasResult && (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  {t(
                    'vin.loading_hint',
                    'Contacting the VIN service. This may take a few seconds…',
                  )}
                </p>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {[1, 2, 3, 4].map((key) => (
                    <div
                      key={key}
                      className="space-y-1"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasResult && result && (
            <div className="w-full max-w-2xl mx-auto space-y-4">
              <VinDecodeResultCard
                vin={result.vin}
                data={result.data}
              />
            </div>
          )}
        </div>
      </main>
      <div className="hidden dev-note mt-4 px-4 pb-4 text-xs text-muted-foreground">
        <p>
          VIN flow helps users paste a VIN once, see structured vehicle data, and then move directly to the
          company catalog with a pre-filled search query. This reduces confusion about the car and connects the
          decode step to the business decision.
        </p>
      </div>
      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default CarfaxPage;
