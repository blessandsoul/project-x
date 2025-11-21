import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Icon } from '@iconify/react/dist/iconify.js';
import { navigationItems, footerLinks } from '@/config/navigation';
import { useVinDecode } from '@/hooks/useVinDecode';

const CarfaxPage = () => {
  const { t } = useTranslation();
  const [vin, setVin] = useState('');
  const { isLoading, error, result, submit, reset } = useVinDecode();

  const mockReport = {
    vin: '1HGCM82633A004352',
    year: 2019,
    make: 'Toyota',
    model: 'Camry SE',
    engine: '2.5L Gasoline',
    transmission: 'Automatic',
    mileage: 82500,
    owners: 2,
    accidents: 1,
    damageSummary: 'წინა ნაწილი დაზიანდა მსუბუქად, შეცვლილია ბამპერი', // Ideally this should be translated too if it's mock data
    lease: false,
    events: [
      { date: '2019-04-12', type: 'registration', description: 'პირველი რეგისტრაცია შტატში California' },
      { date: '2020-08-03', type: 'service', description: 'გეგმიური სერვისი დილერულ ცენტრში' },
      { date: '2022-01-17', type: 'accident', description: 'დაფიქსირდა ავარია, წინა ბამპერის ჩანაცვლება' },
      { date: '2023-05-22', type: 'inspection', description: 'ტექნიკური ინსპექცია გავლილია წარმატებით' },
    ],
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit(vin);
  };

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
        aria-label={t('carfax.title')}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6 flex flex-col">
          <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">{t('carfax.title')}</h1>
            <p className="text-muted-foreground">
              {t('carfax.subtitle')}
            </p>
          </div>

          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">{t('carfax.check_card_title')}</CardTitle>
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
                    {t('carfax.vin_label')}
                  </label>
                  <Input
                    id="vin"
                    value={vin}
                    onChange={(event) => {
                      if (error) {
                        reset();
                      }
                      setVin(event.target.value);
                    }}
                    placeholder={t('carfax.vin_placeholder')}
                    className="uppercase tracking-[0.1em]"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'vin-error' : undefined}
                  />
                  {error && (
                    <p
                      id="vin-error"
                      className="text-xs text-red-600"
                    >
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('carfax.vin_hint')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  <Icon icon="mdi:magnify" className="me-2 h-4 w-4" />
                  {t('carfax.check_btn')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!hasResult && !error && (
            <Card className="border-dashed border-muted w-full max-w-2xl mx-auto">
              <CardContent className="py-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
                <span>{t('carfax.empty_info')}</span>
              </CardContent>
            </Card>
          )}

          {hasResult && (
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon icon="mdi:car-info" className="h-5 w-5 text-primary" />
                      {t('carfax.basic_info')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">VIN</span>
                      <span className="font-medium tracking-[0.1em] uppercase">{result?.vin ?? mockReport.vin}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">{t('carfax.year_make_model')}</span>
                      <span className="font-medium">
                        {mockReport.year} {mockReport.make} {mockReport.model}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">{t('carfax.engine')}</span>
                      <span>{mockReport.engine}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">{t('carfax.transmission')}</span>
                      <span>{mockReport.transmission}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">{t('carfax.last_mileage')}</span>
                      <span>{mockReport.mileage.toLocaleString()} km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon icon="mdi:clipboard-list-outline" className="h-5 w-5 text-primary" />
                      {t('carfax.summary')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:account-group" className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <div className="font-medium">{t('carfax.owners_count')}</div>
                        <div className="text-muted-foreground text-xs">{t('carfax.recorded_owners', { count: mockReport.owners })}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={mockReport.accidents > 0 ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'}
                        className="h-4 w-4 mt-1 text-primary"
                      />
                      <div>
                        <div className="font-medium">{t('carfax.accidents_history')}</div>
                        <div className="text-muted-foreground text-xs">
                          {mockReport.accidents > 0
                            ? t('carfax.recorded_accidents', { count: mockReport.accidents })
                            : t('carfax.no_accidents')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={mockReport.lease ? 'mdi:file-document-edit-outline' : 'mdi:file-document-outline'}
                        className="h-4 w-4 mt-1 text-primary"
                      />
                      <div>
                        <div className="font-medium">{t('carfax.lease_fleet')}</div>
                        <div className="text-muted-foreground text-xs">
                          {mockReport.lease ? t('carfax.lease_record_exists') : t('carfax.no_lease_record')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:car-wrench" className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <div className="font-medium">{t('carfax.damage_desc')}</div>
                        <div className="text-muted-foreground text-xs">{mockReport.damageSummary}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon icon="mdi:timeline-clock-outline" className="h-5 w-5 text-primary" />
                      {t('carfax.events_history')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('common.date')}</TableHead>
                            <TableHead>{t('common.type')}</TableHead>
                            <TableHead>{t('common.description')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockReport.events.map((event) => (
                            <TableRow key={event.date + event.type}>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {event.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{event.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/10 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon icon="mdi:shield-check" className="h-5 w-5 text-primary" />
                    {t('carfax.warning_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    {t('carfax.warning_text_1')}
                  </p>
                  <p>
                    {t('carfax.warning_text_2')}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default CarfaxPage;
