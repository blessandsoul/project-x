import { useState } from 'react';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';
import { useVinDecode } from '@/hooks/useVinDecode';

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
  damageSummary: 'წინა ნაწილი დაზიანდა მსუბუქად, შეცვლილია ბამპერი',
  lease: false,
  events: [
    { date: '2019-04-12', type: 'registration', description: 'პირველი რეგისტრაცია შტატში California' },
    { date: '2020-08-03', type: 'service', description: 'გეგმიური სერვისი დილერულ ცენტრში' },
    { date: '2022-01-17', type: 'accident', description: 'დაფიქსირდა ავარია, წინა ბამპერის ჩანაცვლება' },
    { date: '2023-05-22', type: 'inspection', description: 'ტექნიკური ინსპექცია გავლილია წარმატებით' },
  ],
};

const CarfaxPage = () => {
  const [vin, setVin] = useState('');
  const { isLoading, error, result, submit, reset } = useVinDecode();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit(vin);
  };

  const hasResult = !!result && !error;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />
      <main
        className="flex-1"
        role="main"
        aria-label="VIN შემოწმება"
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6 flex flex-col">
          <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">VIN შემოწმება</h1>
            <p className="text-muted-foreground">
              შეიყვანეთ VIN კოდი და მიიღეთ საცდელი ანგარიში ავტომóbილის ისტორიის შესახებ. შედეგები არის
              მხოლოდ საინფორმაციო და არ წარმოადგენს რეალურ VIN შემოწმების შედეგს.
            </p>
          </div>

          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">VIN კოდის შემოწმება</CardTitle>
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
                    VIN კოდი
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
                    placeholder="მაგ: 1HGCM82633A004352"
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
                    VIN უნდა შეიცავდეს 17 სიმბოლოს (ციფრები და ლათინური ასოები, გარდა I, O, Q).
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                  შეამოწმე
                </Button>
              </form>
            </CardContent>
          </Card>

          {!hasResult && !error && (
            <Card className="border-dashed border-muted w-full max-w-2xl mx-auto">
              <CardContent className="py-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Icon icon="mdi:information-outline" className="h-5 w-5" />
                <span>შეიყვანეთ VIN კოდი, რომ ნახოთ საცდელი ანგარიში ავტომóbილის ისტორიის შესახებ.</span>
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
                      ძირითადი ინფორმაცია
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">VIN</span>
                      <span className="font-medium tracking-[0.1em] uppercase">{result?.vin ?? mockReport.vin}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">წელი / მარკა / მოდელი</span>
                      <span className="font-medium">
                        {mockReport.year} {mockReport.make} {mockReport.model}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">ძრავი</span>
                      <span>{mockReport.engine}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">გადაცემათა კოლოფი</span>
                      <span>{mockReport.transmission}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-muted-foreground">ბოლო დაფიქსირებული გარბენი</span>
                      <span>{mockReport.mileage.toLocaleString()} km</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon icon="mdi:clipboard-list-outline" className="h-5 w-5 text-primary" />
                      მოკლე შეჯამება
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:account-group" className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <div className="font-medium">მფლობელების რაოდენობა</div>
                        <div className="text-muted-foreground text-xs">{mockReport.owners} დაფიქსირებული მფლობელი</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={mockReport.accidents > 0 ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'}
                        className="h-4 w-4 mt-1 text-primary"
                      />
                      <div>
                        <div className="font-medium">ავარიების ისტორია</div>
                        <div className="text-muted-foreground text-xs">
                          {mockReport.accidents > 0
                            ? `${mockReport.accidents} დაფიქსირებული შემთხვევა`
                            : 'დაფიქსირებული ავარიები არ არის'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={mockReport.lease ? 'mdi:file-document-edit-outline' : 'mdi:file-document-outline'}
                        className="h-4 w-4 mt-1 text-primary"
                      />
                      <div>
                        <div className="font-medium">ლიზინგი / ფლითი</div>
                        <div className="text-muted-foreground text-xs">
                          {mockReport.lease ? 'არსებობს ლიზინგის / ფლიტის ჩანაწერი' : 'ლიზინგის ან ფლიტის ჩანაწერი არ არის'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:car-wrench" className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <div className="font-medium">დაზიანების აღწერა</div>
                        <div className="text-muted-foreground text-xs">{mockReport.damageSummary}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon icon="mdi:timeline-clock-outline" className="h-5 w-5 text-primary" />
                      მოვლენების ისტორია
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>თარიღი</TableHead>
                            <TableHead>ტიპი</TableHead>
                            <TableHead>აღწერა</TableHead>
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
                    გაფრთხილება
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    ეს გვერდი ამ ეტაპზე იყენებს სატესტო მონაცემებს და არ არის დაკავშირებული რეალურ VIN
                    შემოწმების სერვისთან. შედეგები გამოიყენეთ მხოლოდ ვიზუალიზაციისა და დიზაინის
                    შესაფასებლად.
                  </p>
                  <p>
                    რეალური ისტორიის მისაღებად საჭიროა ინტეგრაცია ოფიციალურ VIN სერვისთან და მოქმედი API გასაღები.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default CarfaxPage;
