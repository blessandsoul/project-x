import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Skeleton } from '@/components/ui/skeleton';
import { mockNavigationItems, mockFooterLinks, mockCars } from '@/mocks/_mockData';
import { useVehicleSearchQuotes } from '@/hooks/useVehicleSearchQuotes';
import { useVehiclePhotosMap } from '@/hooks/useVehiclePhotosMap';
import { fetchVehiclePhotos } from '@/api/vehicles';

type AuctionHouse = 'all' | 'Copart' | 'IAAI' | 'Manheim';
type LotStatus = 'all' | 'run' | 'enhanced' | 'non-runner';
type DamageType = 'all' | 'front' | 'rear' | 'side';
type SortOption = 'relevance' | 'price-low' | 'price-high' | 'year-new' | 'year-old';

interface AuctionCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  imageUrl: string;
  images: string[];
  vin: string;
  auction: AuctionHouse;
  status: LotStatus;
  damage: DamageType;
  buyNow: boolean;
  document: string;
  yardName: string;
  saleState: string;
  mainDamage: string;
  hasKeys: boolean;
  runAndDrive: boolean;
  retailValue: number;
  calcPrice: number;
  finalBid: number;
}

const enrichCarsForAuctions = (): AuctionCar[] => {
  const auctionHouses: AuctionHouse[] = ['Copart', 'IAAI', 'Manheim'];
  const statuses: LotStatus[] = ['run', 'enhanced', 'non-runner'];
  const damages: DamageType[] = ['front', 'rear', 'side'];

  return mockCars.slice(0, 30).map((baseCar, index) => {
    const auction = auctionHouses[index % auctionHouses.length];
    const status = statuses[index % statuses.length];
    const damage = damages[index % damages.length];
    const buyNow = index % 4 === 0;
    const price = baseCar.price;

    // Mock fields to mirror real auction API structure
    const documentOptions = ['Salvage (Texas)', 'Clean (Florida)', 'Salvage (California)', 'Clean (New York)'];
    const yardOptions = ['Houston-North (TX)', 'Miami (FL)', 'Los Angeles (CA)', 'Newark (NJ)'];
    const stateOptions = ['TX', 'FL', 'CA', 'NJ'];
    const mainDamageOptions = ['FRONT END', 'REAR END', 'MECHANICAL', 'SIDE'];

    const document = documentOptions[index % documentOptions.length];
    const yardName = yardOptions[index % yardOptions.length];
    const saleState = stateOptions[index % stateOptions.length];
    const mainDamage = mainDamageOptions[index % mainDamageOptions.length];
    const hasKeys = index % 3 !== 0;
    const runAndDrive = index % 5 !== 0;
    const retailValue = Math.round(price * 1.6);
    const finalBid = Math.round(price * 0.9);
    const calcPrice = Math.round(finalBid + 2500);

    const imageIndex = (index % 100) + 1;
    const images = Array.from({ length: 8 }).map((_, i) => {
      const idx = ((imageIndex + i) % 100) + 1;
      return `/cars/${idx}.webp`;
    });
    const imageUrl = images[0];

    return {
      id: baseCar.id,
      make: baseCar.make,
      model: baseCar.model,
      year: baseCar.year,
      price,
      mileage: baseCar.mileage,
      imageUrl,
      images,
      vin: baseCar.vin,
      auction,
      status,
      damage,
      buyNow,
      document,
      yardName,
      saleState,
      mainDamage,
      hasKeys,
      runAndDrive,
      retailValue,
      calcPrice,
      finalBid,
    };
  });
};

const auctionCars: AuctionCar[] = enrichCarsForAuctions();

const getDeliveryRangeToPoti = (state: string): { min: number; max: number } => {
  switch (state) {
    case 'TX':
      return { min: 700, max: 900 };
    case 'FL':
      return { min: 650, max: 850 };
    case 'CA':
      return { min: 900, max: 1200 };
    case 'NJ':
      return { min: 750, max: 950 };
    default:
      return { min: 800, max: 1100 };
  }
};

const parseSearchQueryToFilters = (query: string): { make?: string; model?: string } => {
  if (!query) {
    return {};
  }

  const parts = query.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return { make: parts[0] };
  }

  return {
    make: parts[0],
    model: parts.slice(1).join(' '),
  };
};

const AuctionListingsPage = () => {
  const navigate = useNavigate();
  const [auctionFilter, setAuctionFilter] = useState<AuctionHouse>('all');
  const [statusFilter, setStatusFilter] = useState<LotStatus>('all');
  const [damageFilter, setDamageFilter] = useState<DamageType>('all');
  const [priceRange, setPriceRange] = useState<number[]>([500, 30000]);
  const [yearRange, setYearRange] = useState<number[]>([2010, 2024]);
  const [maxMileage, setMaxMileage] = useState<number[]>([200000]);
  const [exactYear, setExactYear] = useState<number | ''>('');
  const [minMileage, setMinMileage] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState('');
  const [category, setCategory] = useState('');
  const [drive, setDrive] = useState('');
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [buyNowOnly, setBuyNowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [galleryCar, setGalleryCar] = useState<AuctionCar | null>(null);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [galleryThumbPage, setGalleryThumbPage] = useState(0);
  const [backendGallery, setBackendGallery] = useState<{
    id: number;
    title: string;
    yardName: string | null;
    saleState: string | null;
    bestTotalPrice: number | null;
    distanceMiles: number | null;
    photos: string[];
  } | null>(null);
  const [backendGalleryIndex, setBackendGalleryIndex] = useState(0);
  const [backendGalleryThumbPage, setBackendGalleryThumbPage] = useState(0);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const searchFilters = useMemo(
    () => {
      const quickFilters = parseSearchQueryToFilters(trimmedQuery);

      const hasExactYear = typeof exactYear === 'number' && !Number.isNaN(exactYear);
      const hasMinMileage = typeof minMileage === 'number' && !Number.isNaN(minMileage);

      const baseFilters: Record<string, unknown> = {
        ...quickFilters,
        mileage_to: maxMileage[0],
        price_from: priceRange[0],
        price_to: priceRange[1],
        fuel_type: fuelType || undefined,
        category: category || undefined,
        drive: drive || undefined,
        limit,
        offset: (page - 1) * limit,
      };

      if (hasExactYear) {
        baseFilters.year = exactYear;
      } else {
        baseFilters.year_from = yearRange[0];
        baseFilters.year_to = yearRange[1];
      }

      if (hasMinMileage) {
        baseFilters.mileage_from = minMileage;
      }

      return baseFilters;
    },
    [
      trimmedQuery,
      yearRange,
      maxMileage,
      priceRange,
      exactYear,
      minMileage,
      fuelType,
      category,
      drive,
      limit,
      page,
    ],
  );

  const {
    data: backendData,
    isLoading: isBackendLoading,
    error: backendError,
    refetch: refetchBackend,
  } = useVehicleSearchQuotes({
    filters: searchFilters,
  });

  const backendVehicleIds = useMemo(
    () => (backendData ? backendData.items.map((item) => item.vehicle_id) : []),
    [backendData],
  );

  const photosByVehicleId = useVehiclePhotosMap({ vehicleIds: backendVehicleIds });

  type BackendData = NonNullable<typeof backendData>;
  type BackendItem = BackendData['items'][number];

  const filteredBackendItems: BackendItem[] = useMemo(() => {
    if (!backendData) {
      return [];
    }

    return backendData.items.filter((item) => {
      const byAuction =
        auctionFilter === 'all' ||
        (item.source && item.source.toLowerCase() === auctionFilter.toLowerCase());

      return byAuction;
    });
  }, [backendData, auctionFilter]);

  const handleOpenBackendGallery = async (
    item: BackendItem,
    fallbackPhotoUrl: string,
  ) => {
    setBackendGallery({
      id: item.vehicle_id,
      title: `${item.year} ${item.make} ${item.model}`,
      yardName: item.yard_name ?? null,
      saleState: item.source ?? null,
      bestTotalPrice:
        item.quotes && item.quotes.length > 0
          ? item.quotes.reduce(
              (min, quote) => (quote.total_price < min ? quote.total_price : min),
              item.quotes[0].total_price,
            )
          : null,
      distanceMiles: item.distance_miles ?? null,
      photos: [fallbackPhotoUrl],
    });
    setBackendGalleryIndex(0);
    setBackendGalleryThumbPage(0);

    try {
      const photos = await fetchVehiclePhotos(item.vehicle_id);
      const urls = Array.isArray(photos)
        ? photos
            .map((photo) => (photo.url || photo.thumb_url_middle || photo.thumb_url) ?? '')
            .filter((url) => url.length > 0)
        : [];

      if (urls.length > 0) {
        setBackendGallery((prev) => (prev ? { ...prev, photos: urls } : prev));
      }
    } catch {
      // keep fallback photo only
    }
  };

  const filteredCars = useMemo(() => {
    const baseFiltered = auctionCars.filter((car) => {
      const byAuction = auctionFilter === 'all' || car.auction === auctionFilter;
      const byStatus = statusFilter === 'all' || car.status === statusFilter;
      const byDamage = damageFilter === 'all' || car.damage === damageFilter;
      const byPrice = car.price >= priceRange[0] && car.price <= priceRange[1];
      const byYear = car.year >= yearRange[0] && car.year <= yearRange[1];
      const byMileage = car.mileage <= maxMileage[0];
      const byBuyNow = !buyNowOnly || car.buyNow;
      const bySearch =
        trimmedQuery.length === 0 ||
        car.make.toLowerCase().includes(trimmedQuery) ||
        car.model.toLowerCase().includes(trimmedQuery);

      return byAuction && byStatus && byDamage && byPrice && byYear && byMileage && byBuyNow && bySearch;
    });

    const sorted = [...baseFiltered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'year-new':
          return b.year - a.year;
        case 'year-old':
          return a.year - b.year;
        default:
          return 0;
      }
    });

    return sorted;
  }, [auctionFilter, statusFilter, damageFilter, priceRange, yearRange, maxMileage, buyNowOnly, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />
      <main
        className="flex-1"
        role="main"
        aria-label="აქტიური აუქციონები"
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">აქტიური აუქციონები</h1>
            <p className="text-muted-foreground">
              ნახეთ დემო-ლისტინგები Copart, IAAI და Manheim აუქციონებიდან და გამოიყენეთ სწრაფი ფილტრები
              თქვენთვის საინტერესო ლოტების საპოვნელად.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">სწრაფი ფილტრები</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4 md:items-end">
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs text-muted-foreground">ძებნა (მარკა, მოდელი)</span>
                  <Input
                    placeholder="მაგ: BMW, Camry, F-150"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">დალაგება</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as SortOption)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="დალაგება" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">რელევანტურობით</SelectItem>
                      <SelectItem value="price-low">ფასი (დაბალი)</SelectItem>
                      <SelectItem value="price-high">ფასი (მაღალი)</SelectItem>
                      <SelectItem value="year-new">წელი (ახალი)</SelectItem>
                      <SelectItem value="year-old">წელი (ძველი)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4 md:items-end">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">აუქციონი</span>
                  <Select
                    value={auctionFilter}
                    onValueChange={(value) => setAuctionFilter(value as AuctionHouse)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="აუქციონი" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="Copart">Copart</SelectItem>
                      <SelectItem value="IAAI">IAAI</SelectItem>
                      <SelectItem value="Manheim">Manheim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">სტატუსი</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as LotStatus)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="სტატუსი" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="run">Run &amp; Drive</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                      <SelectItem value="non-runner">Non-Runner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">დაზიანება</span>
                  <Select
                    value={damageFilter}
                    onValueChange={(value) => setDamageFilter(value as DamageType)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="დაზიანება" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="front">Front</SelectItem>
                      <SelectItem value="rear">Rear</SelectItem>
                      <SelectItem value="side">Side</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-1">
                  <span className="text-xs text-muted-foreground block">
                    ფასი: ${priceRange[0]} - ${priceRange[1]}
                  </span>
                  <Slider
                    value={priceRange}
                    min={500}
                    max={30000}
                    step={500}
                    onValueChange={setPriceRange}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="buyNow"
                      checked={buyNowOnly}
                      onCheckedChange={(checked) => setBuyNowOnly(!!checked)}
                    />
                    <label htmlFor="buyNow" className="text-xs">
                      მხოლოდ Buy Now ლოტები
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 md:items-end">
                <div className="space-y-2 md:col-span-1">
                  <span className="text-xs text-muted-foreground block">
                    წელი: {yearRange[0]} - {yearRange[1]}
                  </span>
                  <Slider
                    value={yearRange}
                    min={2010}
                    max={2024}
                    step={1}
                    onValueChange={setYearRange}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <span className="text-xs text-muted-foreground block">
                    მაქს. გარბენი: {maxMileage[0].toLocaleString()} km
                  </span>
                  <Slider
                    value={maxMileage}
                    min={20000}
                    max={250000}
                    step={10000}
                    onValueChange={setMaxMileage}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <span className="text-xs text-muted-foreground block">ზუსტი წელი / მინ. გარბენი</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder=" напр. 2018"
                      className="h-9 text-xs"
                      value={exactYear === '' ? '' : String(exactYear)}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === '') {
                          setExactYear('');
                          return;
                        }

                        const parsed = Number(value);
                        setExactYear(Number.isNaN(parsed) ? '' : parsed);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="min km"
                      className="h-9 text-xs"
                      value={minMileage === '' ? '' : String(minMileage)}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === '') {
                          setMinMileage('');
                          return;
                        }

                        const parsed = Number(value);
                        setMinMileage(Number.isNaN(parsed) ? '' : parsed);
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    თუ ზუსტი წელი მითითებულია, დიაპაზონი წლიდან/წლამდე იგნორირდება
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4 md:items-end">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">საწვავი</span>
                  <Select
                    value={fuelType}
                    onValueChange={(value) => setFuelType(value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="ყველა" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ყველა</SelectItem>
                      <SelectItem value="gas">ბენზინი</SelectItem>
                      <SelectItem value="diesel">დიზელი</SelectItem>
                      <SelectItem value="hybrid">ჰიბრიდი</SelectItem>
                      <SelectItem value="electric">ელექტრო</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">კატეგორია</span>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="ყველა" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ყველა</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="coupe">Coupe</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">წამყვანი</span>
                  <Select
                    value={drive}
                    onValueChange={(value) => setDrive(value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="ყველა" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ყველა</SelectItem>
                      <SelectItem value="fwd">FWD</SelectItem>
                      <SelectItem value="rwd">RWD</SelectItem>
                      <SelectItem value="4wd">4WD / AWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">რაოდენობა ერთ გვერდზე</span>
                  <Select
                    value={String(limit)}
                    onValueChange={(value) => {
                      const parsed = Number(value);
                      setLimit(parsed);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="20" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="hidden md:flex md:items-center md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuctionFilter('all');
                    setStatusFilter('all');
                    setDamageFilter('all');
                    setPriceRange([500, 30000]);
                    setYearRange([2010, 2024]);
                    setMaxMileage([200000]);
                    setExactYear('');
                    setMinMileage('');
                    setFuelType('');
                    setCategory('');
                    setDrive('');
                    setLimit(20);
                    setPage(1);
                    setBuyNowOnly(false);
                    setSearchQuery('');
                    setSortBy('relevance');
                  }}
                >
                  ფილტრების განულება
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between text-xs text-muted-foreground">
            <span>
              ნაჩვენებია {filteredCars.length} ლოტი {auctionCars.length}-დან (დემო მონაცემები)
            </span>
            <span>
              რეალური ძიება: {' '}
              {isBackendLoading && 'იტვირთება...'}
              {!isBackendLoading && backendError && 'ვერ მოხერხდა რეალური მონაცემების ჩატვირთვა'}
              {!isBackendLoading && !backendError && backendData && `ნაპოვნი მანქანები: ${backendData.total}`}
            </span>
          </div>

          {/* Backend-powered results */}
          <div className="space-y-3 mt-4">
            <h2 className="text-sm font-semibold">რეალური შედეგები (Vehicles + Quotes API)</h2>
            {isBackendLoading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden flex flex-col">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="pt-3 space-y-2 text-xs">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isBackendLoading && backendError && (
              <Card className="border-destructive/40 bg-destructive/5 text-xs">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <span className="text-destructive">ვერ მოხერხდა რეალური მონაცემების ჩატვირთვა</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-[11px]"
                    onClick={() => refetchBackend()}
                  >
                    თავიდან ცდა
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isBackendLoading && !backendError && backendData && filteredBackendItems.length > 0 && (
              <>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    გვერდი {page} / {backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit))}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      წინა
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={
                        page >=
                        (backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit)))
                      }
                      onClick={() =>
                        setPage((prev) =>
                          prev >=
                          (backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit)))
                            ? prev
                            : prev + 1,
                        )
                      }
                    >
                      შემდეგი
                    </Button>
                  </div>
                </div>
                <div
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  aria-label="რეალური ლოტების შედეგები"
                >
                  {filteredBackendItems.map((item) => {
                  const photoUrl = photosByVehicleId[item.vehicle_id] || '/cars/1.webp';
                  const bestQuote = item.quotes.reduce((min, quote) =>
                    quote.total_price < min.total_price ? quote : min,
                  item.quotes[0]);

                  return (
                    <Card key={`${item.vehicle_id}-${item.make}-${item.model}`} className="overflow-hidden flex flex-col p-0">
                      <button
                        type="button"
                        className="relative h-40 w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/60"
                        onClick={() => handleOpenBackendGallery(item, photoUrl)}
                      >
                        <img
                          src={photoUrl}
                          alt={`${item.year} ${item.make} ${item.model}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base leading-tight">
                              {item.year} {item.make} {item.model}
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {item.yard_name} • {item.source}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-muted-foreground">საუკეთესო სრული ფასი</div>
                            <div className="font-semibold text-sm">
                              ${bestQuote.total_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col justify-between text-xs">
                        <div className="space-y-2 mb-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <span className="block text-[10px] text-muted-foreground">გარბენი</span>
                              <span>{item.mileage ? item.mileage.toLocaleString() : 'N/A'} km</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-muted-foreground">დისტანცია</span>
                              <span>{item.distance_miles.toLocaleString()} mi</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon icon="mdi:cash" className="h-4 w-4 text-primary" />
                            <span>
                              სრული ფასი იმპორტით:
                              {' '}
                              <span className="font-medium">
                                ${bestQuote.total_price.toLocaleString()} USD
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-3 pb-2 border-t mt-auto">
                          <span className="text-[10px] text-muted-foreground truncate">
                            კომპანია: {bestQuote.company_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() =>
                                navigate(`/vehicle/${item.vehicle_id}`, {
                                  state: { scrollToOffers: true },
                                })
                              }
                            >
                              ღირებულების გათვლა
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => navigate(`/vehicle/${item.vehicle_id}`)}
                            >
                              დეტალურად ნახვა
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </>
            )}
          </div>

          {/* Existing mock-based demo grid remains as a fallback/demo section */}

          {filteredCars.length === 0 ? (
            <Card className="py-10 flex flex-col items-center justify-center gap-3">
              <Icon icon="mdi:car-off" className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-base font-semibold">ამ პარამეტრებით ლოტები ვერ მოიძებნა</h2>
              <p className="text-xs text-muted-foreground">
                სცადეთ სხვა აუქციონი, სტატუსი ან გაზარდეთ ფასის დიაპაზონი.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setAuctionFilter('all');
                  setStatusFilter('all');
                  setDamageFilter('all');
                  setPriceRange([500, 30000]);
                  setYearRange([2010, 2024]);
                  setMaxMileage([200000]);
                  setBuyNowOnly(false);
                  setSearchQuery('');
                  setSortBy('relevance');
                }}
              >
                ფილტრების გასუფთავება
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => (
                <Card key={car.id} className="overflow-hidden flex flex-col p-0">
                  <button
                    type="button"
                    className="relative h-40 w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/60"
                    onClick={() => {
                      setGalleryCar(car);
                      setGalleryImageIndex(0);
                    }}
                  >
                    <img
                      src={car.imageUrl}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <Badge className="bg-black/80 text-[11px] text-white border-none flex items-center gap-1 px-2 py-0.5 rounded-full">
                        <Icon icon="mdi:gavel" className="h-3 w-3" />
                        <span>{car.auction}</span>
                      </Badge>
                      {car.runAndDrive && (
                        <Badge className="bg-emerald-500/90 text-[11px] text-white border-none flex items-center gap-1 px-2 py-0.5 rounded-full">
                          <Icon icon="mdi:engine" className="h-3 w-3" />
                          <span>Run &amp; Drive</span>
                        </Badge>
                      )}
                      {!car.hasKeys && (
                        <Badge className="bg-red-500/90 text-[11px] text-white border-none flex items-center gap-1 px-2 py-0.5 rounded-full">
                          <Icon icon="mdi:key-off" className="h-3 w-3" />
                          <span>No Keys</span>
                        </Badge>
                      )}
                      {car.buyNow && (
                        <Badge className="bg-amber-500/90 text-[11px] text-white border-none flex items-center gap-1 px-2 py-0.5 rounded-full">
                          <Icon icon="mdi:flash" className="h-3 w-3" />
                          <span>Buy Now</span>
                        </Badge>
                      )}
                    </div>
                  </button>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base leading-tight">
                          {car.year} {car.make} {car.model}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {car.yardName} • {car.saleState}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground">მიმდინარე ფასი</div>
                        <div className="font-semibold text-sm">${car.finalBid.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          სავაჭრო ღირებულება: ${car.retailValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="block text-[10px] text-muted-foreground">გარბენი</span>
                          <span>{car.mileage.toLocaleString()} km</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground">დოკუმენტი</span>
                          <span className="truncate" title={car.document}>{car.document}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground">ძირითადი დაზიანება</span>
                          <span className="uppercase text-[11px]">{car.mainDamage}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground">Run &amp; Drive</span>
                          <span>{car.runAndDrive ? 'კი' : 'არა'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:cash" className="h-4 w-4 text-primary" />
                        <span>
                          სავარაუდო სრული ფასი იმპორტით:
                          {' '}
                          <span className="font-medium">
                            ${car.calcPrice.toLocaleString()} USD
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 pb-2 border-t mt-auto">
                      <span className="text-[10px] text-muted-foreground truncate">
                        VIN: {car.vin}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        დეტალურად ნახვა
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <AnimatePresence>
            {galleryCar && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setGalleryCar(null)}
              >
                <motion.div
                  className="max-w-4xl w-full bg-background rounded-lg shadow-lg overflow-hidden"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge className="bg-black/80 text-[11px] text-white border-none">
                        {galleryCar.auction}
                      </Badge>
                      <span className="text-muted-foreground">
                        {galleryCar.year} {galleryCar.make} {galleryCar.model}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setGalleryCar(null)}
                      aria-label="დახურვა"
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-col md:flex-row">
                    {/* Image + thumbnails */}
                    <div className="w-full md:w-2/3 bg-background flex flex-col items-center justify-center">
                      <div className="w-full flex items-center justify-center">
                        <img
                          src={galleryCar.images[galleryImageIndex] ?? galleryCar.imageUrl}
                          alt={`${galleryCar.year} ${galleryCar.make} ${galleryCar.model}`}
                          className="w-full max-h-[460px] object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 p-3 w-full">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 text-[11px]"
                          disabled={galleryThumbPage === 0}
                          onClick={() => setGalleryThumbPage((prev) => Math.max(0, prev - 1))}
                          aria-label="Previous photos"
                        >
                          <Icon icon="mdi:chevron-left" className="h-3 w-3" />
                        </Button>
                        <div className="flex flex-nowrap gap-2 justify-center">
                          {(() => {
                            const perPage = 6;
                            const start = galleryThumbPage * perPage;
                            const current = galleryCar.images.slice(start, start + perPage);

                            return current.map((img, index) => {
                              const globalIndex = start + index;
                              return (
                                <button
                                  key={img}
                                  type="button"
                                  className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-sm border ${
                                    globalIndex === galleryImageIndex
                                      ? 'border-primary'
                                      : 'border-border hover:border-primary/60'
                                  }`}
                                  onClick={() => setGalleryImageIndex(globalIndex)}
                                >
                                  <img
                                    src={img}
                                    alt={`thumb-${globalIndex}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              );
                            });
                          })()}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 text-[11px]"
                          disabled={(galleryThumbPage + 1) * 6 >= galleryCar.images.length}
                          onClick={() =>
                            setGalleryThumbPage((prev) =>
                              (prev + 1) * 6 < galleryCar.images.length ? prev + 1 : prev,
                            )
                          }
                          aria-label="Next photos"
                        >
                          <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Info on the right */}
                    <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l px-4 py-3 text-[11px] space-y-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm leading-tight">
                          {galleryCar.year} {galleryCar.make} {galleryCar.model}
                        </div>
                        <div className="text-muted-foreground">
                          VIN: <span className="font-medium">{galleryCar.vin}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {galleryCar.yardName} • {galleryCar.saleState}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">მიმდინარე ფასი</span>
                          <span className="font-semibold text-sm">${galleryCar.finalBid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>სავაჭრო ღირებულება</span>
                          <span className="font-medium text-foreground">${galleryCar.retailValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>სრული ფასი იმპორტით</span>
                          <span className="font-medium text-foreground">${galleryCar.calcPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const { min, max } = getDeliveryRangeToPoti(galleryCar.saleState);
                          const totalMin = galleryCar.calcPrice + min;
                          const totalMax = galleryCar.calcPrice + max;

                          return (
                            <>
                              <p className="text-muted-foreground font-medium">მიწოდება ფოთამდე</p>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>ლოგისტიკა აშშ პორტიდან ფოთამდე</span>
                                <span className="font-semibold text-foreground">
                                  ${min.toLocaleString()} - ${max.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>სრული ფასი ფოთამდე (დაახლოებით)</span>
                                <span className="font-semibold text-foreground">
                                  ${totalMin.toLocaleString()} - ${totalMax.toLocaleString()}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                        <div>
                          <span className="block">გარბენი</span>
                          <span className="font-medium text-foreground">{galleryCar.mileage.toLocaleString()} km</span>
                        </div>
                        <div>
                          <span className="block">ძირითადი დაზიანება</span>
                          <span className="font-medium text-foreground uppercase">{galleryCar.mainDamage}</span>
                        </div>
                        <div>
                          <span className="block">Run &amp; Drive</span>
                          <span className="font-medium text-foreground">{galleryCar.runAndDrive ? 'კი' : 'არა'}</span>
                        </div>
                        <div>
                          <span className="block">გასაღები</span>
                          <span className="font-medium text-foreground">{galleryCar.hasKeys ? 'კი' : 'არა'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {backendGallery && (
              <motion.div
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setBackendGallery(null)}
              >
                <motion.div
                  className="max-w-4xl w-full bg-background rounded-lg shadow-lg overflow-hidden"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <div className="font-medium text-sm truncate">{backendGallery.title}</div>
                      <div className="text-muted-foreground">
                        {backendGallery.yardName}{' '}
                        {backendGallery.saleState ? `• ${backendGallery.saleState}` : ''}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setBackendGallery(null)}
                      aria-label="დახურვა"
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-2/3 bg-background flex flex-col items-center justify-center">
                      <div className="w-full flex items-center justify-center">
                        <img
                          src={backendGallery.photos[backendGalleryIndex] ?? backendGallery.photos[0]}
                          alt={backendGallery.title}
                          className="w-full max-h-[460px] object-contain"
                        />
                      </div>
                      {backendGallery.photos.length > 1 && (
                        <div className="flex items-center justify-center gap-2 p-3 w-full">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 text-[11px]"
                            disabled={backendGalleryThumbPage === 0}
                            onClick={() =>
                              setBackendGalleryThumbPage((prev) => Math.max(0, prev - 1))
                            }
                            aria-label="Previous photos"
                          >
                            <Icon icon="mdi:chevron-left" className="h-3 w-3" />
                          </Button>
                          <div className="flex flex-nowrap gap-2 justify-center">
                            {(() => {
                              const perPage = 6;
                              const start = backendGalleryThumbPage * perPage;
                              const current = backendGallery.photos.slice(start, start + perPage);

                              return current.map((photoUrl, index) => {
                                const globalIndex = start + index;
                                return (
                                  <button
                                    key={photoUrl + globalIndex}
                                    type="button"
                                    className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-sm border ${
                                      globalIndex === backendGalleryIndex
                                        ? 'border-primary'
                                        : 'border-border hover:border-primary/60'
                                    }`}
                                    onClick={() => setBackendGalleryIndex(globalIndex)}
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`thumb-${globalIndex}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                );
                              });
                            })()}
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 text-[11px]"
                            disabled={(backendGalleryThumbPage + 1) * 6 >= backendGallery.photos.length}
                            onClick={() =>
                              setBackendGalleryThumbPage((prev) =>
                                (prev + 1) * 6 < backendGallery.photos.length ? prev + 1 : prev,
                              )
                            }
                            aria-label="Next photos"
                          >
                            <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l px-4 py-3 text-[11px] space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        {backendGallery.bestTotalPrice != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">საუკეთესო სრული ფასი</span>
                            <span className="font-semibold text-sm">
                              ${backendGallery.bestTotalPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {backendGallery.distanceMiles != null && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>დისტანცია ფოთამდე</span>
                            <span className="font-medium text-foreground">
                              {backendGallery.distanceMiles.toLocaleString()} mi
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() =>
                              navigate(`/vehicle/${backendGallery.id}`, {
                                state: { scrollToOffers: true },
                              })
                            }
                          >
                            ღირებულების გათვლა
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => navigate(`/vehicle/${backendGallery.id}`)}
                          >
                            დეტალურად ნახვა
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default AuctionListingsPage;
