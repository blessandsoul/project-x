import { useState } from 'react';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';

const mockStates = [
  { state: 'California', avgPrice: 2100, avgDays: 25, risk: 'medium', bestPort: 'Los Angeles' },
  { state: 'Texas', avgPrice: 1900, avgDays: 22, risk: 'low', bestPort: 'Houston' },
  { state: 'Florida', avgPrice: 1800, avgDays: 20, risk: 'low', bestPort: 'Jacksonville' },
  { state: 'New York', avgPrice: 2200, avgDays: 24, risk: 'medium', bestPort: 'Newark' },
  { state: 'Georgia', avgPrice: 1750, avgDays: 19, risk: 'low', bestPort: 'Savannah' },
  { state: 'Illinois', avgPrice: 2050, avgDays: 23, risk: 'medium', bestPort: 'Chicago' },
];

const LogisticsRadarPage = () => {
  const [port, setPort] = useState('all');
  const [metric, setMetric] = useState<'price' | 'time' | 'risk'>('price');
  const [maxPrice, setMaxPrice] = useState<number[]>([2500]);

  const filteredStates = mockStates.filter((item) => {
    const byPort = port === 'all' || item.bestPort === port;
    const byPrice = item.avgPrice <= maxPrice[0];
    return byPort && byPrice;
  });

  const getRiskBadge = (risk: string) => {
    if (risk === 'low') {
      return <Badge className="bg-emerald-100 text-emerald-700 border-none">დაბალი</Badge>;
    }

    if (risk === 'medium') {
      return <Badge className="bg-amber-100 text-amber-700 border-none">საშუალო</Badge>;
    }

    return <Badge className="bg-red-100 text-red-700 border-none">მაღალი</Badge>;
  };

  const avgForSummary = (() => {
    if (!filteredStates.length) {
      return null;
    }

    const totalPrice = filteredStates.reduce((sum, s) => sum + s.avgPrice, 0);
    const totalDays = filteredStates.reduce((sum, s) => sum + s.avgDays, 0);
    const price = Math.round(totalPrice / filteredStates.length);
    const days = Math.round(totalDays / filteredStates.length);

    return { price, days };
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />
      <main
        className="flex-1"
        role="main"
        aria-label="ლოგისტიკის რადარი"
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">ლოგისტიკის რადარი</h1>
            <p className="text-muted-foreground">
              შეადარეთ შტატების მიხედვით მიწოდების ფასი და სავარაუდო დრო აშშ-დან საქართველოს პორტებამდე.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <CardTitle className="text-lg">ფილტრები შტატების რუკისთვის</CardTitle>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <span className="text-xs text-muted-foreground">გამოსატანი პორტი</span>
                    <Select value={port} onValueChange={setPort}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="აირჩიეთ პორტი" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ყველა პორტი</SelectItem>
                        <SelectItem value="Savannah">Savannah</SelectItem>
                        <SelectItem value="Newark">Newark</SelectItem>
                        <SelectItem value="Houston">Houston</SelectItem>
                        <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                        <SelectItem value="Jacksonville">Jacksonville</SelectItem>
                        <SelectItem value="Chicago">Chicago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <span className="text-xs text-muted-foreground">დასათვალიერებელი მეტრიკა</span>
                    <Select
                      value={metric}
                      onValueChange={(value) => setMetric(value as 'price' | 'time' | 'risk')}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">ფასი</SelectItem>
                        <SelectItem value="time">მიწოდების დრო</SelectItem>
                        <SelectItem value="risk">რისკის დონე</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 max-w-xs">
                    <span className="text-xs text-muted-foreground">
                      მაქსიმალური საშუალო ფასი: ${maxPrice[0]} USD
                    </span>
                    <Slider
                      value={maxPrice}
                      min={1500}
                      max={3000}
                      step={100}
                      onValueChange={setMaxPrice}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>შტატი</TableHead>
                        <TableHead>საშ. ფასი (USD)</TableHead>
                        <TableHead>საშ. დრო (დღე)</TableHead>
                        <TableHead>რისკი</TableHead>
                        <TableHead>ძირითადი პორტი</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            არჩეული პარამეტრებით შტატები ვერ მოიძებნა. სცადეთ გაზარდოთ მაქსიმალური ფასი.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStates.map((item) => (
                          <TableRow key={item.state}>
                            <TableCell>{item.state}</TableCell>
                            <TableCell>
                              <span className="font-medium">${item.avgPrice}</span>
                            </TableCell>
                            <TableCell>{item.avgDays}</TableCell>
                            <TableCell>{getRiskBadge(item.risk)}</TableCell>
                            <TableCell>{item.bestPort}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon icon="mdi:radar" className="h-5 w-5 text-primary" />
                  შეჯამება არჩეული პარამეტრებისთვის
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {avgForSummary ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">საშუალო ლოგისტიკის ფასი</span>
                      <span className="text-lg font-semibold">${avgForSummary.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">საშუალო მიწოდების დრო</span>
                      <span className="text-lg font-semibold">{avgForSummary.days} დღე</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <p className="text-xs text-muted-foreground">
                        ეს მონაცემები არის დემო-მოდელის მიხედვით ჩამოყალიბებული და გამოიყენება მხოლოდ
                        საკვლევად. რეალური ფასები და დრო დამოკიდებულია კონკრეტულ აუქციონზე, სატრანსპორტო
                        კომპანიაზე და სეზონურობაზე.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    ჯერ აირჩიეთ ისეთი პარამეტრები, რომ მაინც ერთი შტატი მაინც დარჩეს სიაში, და აქ
                    გამოჩნდება საშუალო ფასი და დრო.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default LogisticsRadarPage;
