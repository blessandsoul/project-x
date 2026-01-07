import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// Header and Footer are provided by MainLayout
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Icon } from '@iconify/react/dist/iconify.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ColumnDef,
  Row,
  VisibilityState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
// navigationItems now handled by MainLayout
import { searchVehicles, compareVehicles } from '@/api/vehicles';
import type { VehiclesCompareResponse } from '@/api/vehicles';
import { fetchCatalogMakes, fetchCatalogModels } from '@/api/catalog';
import type {
  CatalogMake,
  CatalogModel,
  VehicleCatalogType,
} from '@/api/catalog';
import type {
  SearchVehiclesResponse,
  VehiclesSearchFilters,
  VehicleSortOption,
} from '@/types/vehicles';
import { useCalculateVehicleQuotes } from '@/hooks/useCalculateVehicleQuotes';
import { useVehicleWatchlist } from '@/hooks/useVehicleWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { AuctionSidebarFilters, type CategoryFilter } from '@/components/auction/AuctionSidebarFilters';
import { AuctionFiltersDrawer } from '@/components/auction/AuctionFiltersDrawer';
import { AuctionVehicleCard } from '@/components/auction/AuctionVehicleCard';

import { ComparisonModal } from '@/components/auction/ComparisonModal';
import { QuotesShowcase } from '@/components/auction/QuotesShowcase';



type AuctionHouse = 'all' | 'Copart' | 'IAAI';
type LotStatus = 'all' | 'run' | 'enhanced' | 'non-runner';
type DamageType = 'all' | 'front' | 'rear' | 'side';
type SortOption = 'none' | VehicleSortOption;

// Define BackendItem type
type BackendItem = SearchVehiclesResponse["items"][number];

// NOTE: mockCars-based auction listings were used earlier for mock/testing purposes.
// The page now relies solely on real API data via /vehicles/search.

type DraftFiltersInput = {
  searchQuery: string;
  exactYear: number | "";
  mileageRange: number[];
  priceRange: number[];
  yearRange: number[];
  fuelType: string;
  category: string;
  drive: string;
  limit: number;
  page: number;
  searchKind: "all" | "car" | "moto" | "van";
  auctionFilter: AuctionHouse;
  buyNowOnly: boolean;
  selectedMakeName?: string;
  selectedModelName?: string;
  sort?: SortOption;
  titleType?: string;
  transmission?: string;
  fuel?: string;
  driveFilter?: string;
  cylinders?: string;
  location?: string;
  sourceFilter?: string;
  dateFilter?: string;
};

const buildFiltersFromDraftState = (
  input: DraftFiltersInput
): VehiclesSearchFilters & { page: number; limit: number } => {
  const trimmedSearch = input.searchQuery.trim();

  const hasExactYear =
    typeof input.exactYear === "number" && !Number.isNaN(input.exactYear);

  // Only include price filters if they have meaningful values (not 0)
  const priceFrom = input.priceRange[0];
  const priceTo = input.priceRange[1];
  const hasPriceFilter = priceFrom > 0 || priceTo > 0;

  // Mileage range
  const mileageFrom = input.mileageRange[0];
  const mileageTo = input.mileageRange[1];

  const baseFilters: VehiclesSearchFilters & { page: number; limit: number } = {
    search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    make: input.selectedMakeName,
    model: input.selectedModelName,
    mileage_from: mileageFrom > 0 ? mileageFrom : undefined,
    mileage_to: mileageTo > 0 ? mileageTo : undefined,
    price_from: hasPriceFilter && priceFrom > 0 ? priceFrom : undefined,
    price_to: hasPriceFilter && priceTo > 0 ? priceTo : undefined,
    fuel_type: input.fuelType === "all" ? undefined : input.fuelType,
    // category codes: 'v', 'c', 'a'; 'all' means no category filter
    category: input.category === "all" ? undefined : input.category,
    // drive filter: comma-separated values (front, rear, full)
    drive: input.driveFilter || undefined,
    // source filter: comma-separated values (copart, iaai)
    // Ensure source filter is passed even when both are selected (e.g., "copart,iaai")
    source: input.sourceFilter && input.sourceFilter.trim().length > 0 ? input.sourceFilter : undefined,
    // title type filter: comma-separated values
    title_type: input.titleType || undefined,
    // transmission filter: 'auto', 'manual', or 'auto,manual'
    transmission: input.transmission || undefined,
    // fuel filter: comma-separated values
    fuel: input.fuel || undefined,
    // location filter: city/yard name (normalized: lowercase, spaces removed)
    location: input.location ? input.location.toLowerCase().replace(/\s/g, '') : undefined,
    // cylinders filter: comma-separated, normalized to uppercase for API
    cylinders: input.cylinders ? input.cylinders.toUpperCase() : undefined,
    // date filter: exact date in YYYY-MM-DD format
    date: input.dateFilter || undefined,
    limit: input.limit,
    page: input.page,
  };

  if (hasExactYear) {
    baseFilters.year = input.exactYear as number;
  } else {
    // Only include year filters if they have meaningful values (not 0)
    const yearFrom = input.yearRange[0];
    const yearTo = input.yearRange[1];

    // Only swap if both values are set (non-zero) and from > to
    if (yearFrom > 0 && yearTo > 0 && yearFrom > yearTo) {
      baseFilters.year_from = yearTo;
      baseFilters.year_to = yearFrom;
    } else {
      if (yearFrom > 0) baseFilters.year_from = yearFrom;
      if (yearTo > 0) baseFilters.year_to = yearTo;
    }
  }

  if (input.buyNowOnly) {
    baseFilters.buy_now = true;
  }

  // Only include sort if it's not 'none'
  if (input.sort && input.sort !== "none") {
    baseFilters.sort = input.sort;
  }

  return baseFilters;
};

const formatMoney = (
  value: number | string | null | undefined,
  currency: "USD" | "GEL" = "USD"
): string | null => {
  if (value == null) return null;

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;

  if (currency === "GEL") {
    return `${numeric.toLocaleString()} GEL`;
  }

  return `$${numeric.toLocaleString()}`;
};

// Table columns definition
const createColumns = (
  showCompareCheckbox: boolean,
  selectedVehicleIds: number[],
  onToggleSelect: (item: BackendItem, checked: boolean) => void,
  onToggleWatch: (item: BackendItem) => void,
  onViewDetails: (item: BackendItem) => void,
  isWatched: (id: number) => boolean,
  t: any,
  localeList: string[],
  isGeorgian: boolean,
  monthShortKa: string[],
  _isLargeScreen: boolean,
): ColumnDef<BackendItem>[] => [
    // Checkbox column
    ...(showCompareCheckbox ? [{
      id: 'select',
      header: () => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label="Select all"
            className="h-4 w-4"
          />
        </div>
      ),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;
        const isSelected = selectedVehicleIds.includes(item.vehicle_id ?? item.id);
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelect(item, checked === true)}
              className="h-4 w-4"
              aria-label={`Select ${item.year} ${item.make} ${item.model}`}
            />
          </div>
        );
      },
      enableSorting: false,
      size: 40,
    }] : []),
    // Image column
    {
      id: 'image',
      header: t('auction.columns.image'),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;
        const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';
        return (
          <div className="relative aspect-[4/3] w-32 rounded-md overflow-hidden bg-muted">
            <button
              type="button"
              className="w-full h-full focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              onClick={() => onViewDetails(item)}
            >
              <img
                src={mainPhotoUrl}
                alt={`${item.year} ${item.make} ${item.model}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
            {/* Source tag (Copart/IAAI) */}
            {item.source && (
              <div className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase text-white ${item.source.toLowerCase() === 'copart' ? 'bg-[#002d72]' : 'bg-[#c41230]'
                }`}>
                {item.source.toLowerCase() === 'copart' ? 'Copart' : 'IAAI'}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 150,
    },
    // Lot Info column
    {
      id: 'lot_info',
      header: t('auction.columns.lot_info'),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;
        return (
          <div className="max-w-[140px] pl-2">
            <button onClick={() => onViewDetails(item)} className="text-left">
              <h3 className="font-semibold text-xs text-primary hover:underline leading-tight uppercase whitespace-normal break-words">
                {item.year} {item.make} {item.model}
              </h3>
            </button>
            <div className="text-muted-foreground mt-0.5 text-[11px]">
              {t('auction.lot')} <span className="text-primary font-medium">{item.source_lot_id || item.id}</span>
            </div>
            {/* Yard name - always visible under lot */}
            {item.yard_name && (
              <div className="mt-0.5 text-[11px] text-muted-foreground truncate" title={item.yard_name}>
                {item.yard_name}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant={isWatched(item.vehicle_id ?? item.id) ? "default" : "outline"}
                size="sm"
                className={`h-6 text-[10px] gap-1 ${isWatched(item.vehicle_id ?? item.id) && "bg-green-600 hover:bg-green-700"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatch(item);
                }}
              >
                <Icon icon="mdi:bookmark" className="w-3 h-3" />
                {t('auction.actions.watch')}
              </Button>
            </div>
          </div>
        );
      },
      size: 110,
    },
    // Vehicle Info column
    {
      id: 'vehicle_info',
      header: t('auction.columns.vehicle_info'),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;
        const retailValue = item.retail_value
          ? (typeof item.retail_value === 'number' ? item.retail_value : Number(item.retail_value))
          : null;

        return (
          <div>
            <div className="text-muted-foreground text-[11px]">{t('auction.fields.odometer')}</div>
            <div className="font-semibold text-foreground">
              {item.mileage ? item.mileage.toLocaleString() : 'N/A'}
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11px]">{t('auction.fields.estimated_retail_value')}</div>
            <div className="font-semibold text-foreground">
              {retailValue ? formatMoney(retailValue) : 'N/A'}
            </div>
          </div>
        );
      },
      size: 105,
    },
    // Document column (renamed from Condition)
    {
      id: 'document',
      header: t('auction.columns.document'),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;

        // Format auction start date/time
        const formatAuctionDate = (): { date: string; time: string; isUpcoming: boolean } | null => {
          if (!item.sold_at_date) return null;

          try {
            const auctionDate = new Date(item.sold_at_date);
            const now = new Date();
            const isUpcoming = auctionDate > now;

            // Format date: "Nov 12, 2025"
            const dateStr = isGeorgian
              ? `${monthShortKa[auctionDate.getMonth()]} ${auctionDate.getDate()}, ${auctionDate.getFullYear()}`
              : new Intl.DateTimeFormat(localeList, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(auctionDate);

            // Format time from sold_at_time if available, otherwise from the date
            let timeStr = '';
            if (item.sold_at_time) {
              // Parse "18:00:00" format
              const [hours, minutes] = item.sold_at_time.split(':');
              const hour = parseInt(hours, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              timeStr = `${hour12}:${minutes} ${ampm}`;
            } else {
              timeStr = new Intl.DateTimeFormat(localeList, {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }).format(auctionDate);
            }

            return { date: dateStr, time: timeStr, isUpcoming };
          } catch {
            return null;
          }
        };

        const auctionInfo = formatAuctionDate();

        return (
          <div className="max-w-[180px] whitespace-normal break-words">
            <div className="text-muted-foreground text-[10px] mb-0.5">{t('auction.document_label')}</div>
            <div className="text-foreground font-medium text-[11px]">{item.document || 'N/A'}</div>

            {/* Auction Start Date - Eye-catching display */}
            {auctionInfo && (
              <div className="mt-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon
                    icon={auctionInfo.isUpcoming ? "mdi:calendar-clock" : "mdi:calendar-check"}
                    className={`w-3.5 h-3.5 ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'}`}
                  />
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${auctionInfo.isUpcoming ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                    {auctionInfo.isUpcoming ? t('auction.auction_starts') : t('auction.auction_start_date')}
                  </span>
                </div>
                <div className={`text-[12px] font-bold ${auctionInfo.isUpcoming ? 'text-emerald-800' : 'text-slate-700'
                  }`}>
                  {auctionInfo.date}
                </div>
                <div className={`text-[11px] font-semibold ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                  {auctionInfo.time}
                </div>
              </div>
            )}
          </div>
        );
      },
      size: 140,
    },
    // Bids column
    {
      id: 'bids',
      header: t('auction.columns.bids'),
      cell: ({ row }: { row: Row<BackendItem> }) => {
        const item = row.original;

        // Last bid from API (preferred) or fallback to calc_price
        const lastBid = item.last_bid;
        let currentBidValue: number | null = null;
        let bidTime: string | null = null;

        if (lastBid && lastBid.bid != null) {
          currentBidValue = lastBid.bid;
          bidTime = lastBid.bid_time;
        } else if (item.calc_price != null) {
          const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
          if (Number.isFinite(numericCalc)) currentBidValue = numericCalc;
        }

        // Format bid time for display
        const formatBidTime = (isoTime: string | null): string => {
          if (!isoTime) return '';
          try {
            const date = new Date(isoTime);
            if (isGeorgian) {
              const month = monthShortKa[date.getMonth()];
              const day = date.getDate();
              const year = date.getFullYear();
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${month} ${day}, ${year}, ${hours}:${minutes}`;
            }
            return new Intl.DateTimeFormat(localeList, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(date);
          } catch {
            return '';
          }
        };

        // Buy Now price
        let buyNowPrice: number | null = null;
        if (item.buy_it_now_price != null) {
          const numeric = typeof item.buy_it_now_price === 'number' ? item.buy_it_now_price : Number(item.buy_it_now_price);
          if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
        } else if (item.buy_it_now != null) {
          const numeric = typeof item.buy_it_now === 'number' ? item.buy_it_now : Number(item.buy_it_now);
          if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
        }

        const hasBuyNow = buyNowPrice != null;

        return (
          <div className="flex flex-col">
            <div className="text-muted-foreground text-[10px]">{t('auction.fields.current_bid')}</div>
            <div className="text-base font-bold text-foreground">
              {formatMoney(currentBidValue)} <span className="text-xs font-normal text-muted-foreground">USD</span>
            </div>
            {bidTime && (
              <div className="text-[9px] text-muted-foreground mb-1.5">
                {formatBidTime(bidTime)}
              </div>
            )}
            {!bidTime && <div className="mb-2" />}

            <Button
              size="sm"
              className="w-full h-7 text-[11px] bg-primary hover:bg-primary/90 text-white font-semibold mb-1.5"
              onClick={() => onViewDetails(item)}
            >
              {t('auction.actions.bid_now')}
            </Button>

            {hasBuyNow ? (
              <div className="flex flex-col gap-0.5 text-[10px] sm:flex-row sm:items-center sm:gap-1">
                <Button
                  size="sm"
                  className="w-full sm:w-auto h-7 px-3 text-[10px] bg-accent hover:bg-accent/90 text-primary font-semibold whitespace-nowrap"
                  onClick={() => onViewDetails(item)}
                >
                  {t('auction.actions.buy_it_now')}
                </Button>
                <span className="text-[10px] text-foreground font-semibold whitespace-nowrap">
                  {formatMoney(buyNowPrice)} <span className="text-[9px] font-normal text-muted-foreground">USD</span>
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[11px] border-primary text-primary hover:bg-primary/5"
                onClick={() => onViewDetails(item)}
              >
                {t('common.details')}
              </Button>
            )}
          </div>
        );
      },
      size: 170,
    },
  ];

const AuctionListingsPage = () => {
  const { t, i18n } = useTranslation();
  const localeList = [
    i18n.language === 'ka' ? 'ka-GE' : i18n.language || 'en',
    'ka',
    'ka-GE',
    'en',
  ];
  const isGeorgian = i18n.language?.startsWith('ka');
  const monthShortKa = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
  const navigate = useNavigate();
  const location = useLocation();
  const [auctionFilter, setAuctionFilter] = useState<AuctionHouse>("all");
  const [, setStatusFilter] = useState<LotStatus>("all");
  const [, setDamageFilter] = useState<DamageType>("all");
  // Start with no price/year/mileage filters applied; the user or URL must opt-in.
  const [priceRange, setPriceRange] = useState<number[]>([0, 0]);
  const [yearRange, setYearRange] = useState<number[]>([0, 0]);
  const [mileageRange, setMileageRange] = useState<number[]>([0, 0]);
  const [exactYear, setExactYear] = useState<number | "">("");
  const [fuelType, setFuelType] = useState("all");
  const [category, setCategory] = useState("all");
  const [drive, setDrive] = useState("all");
  const [titleType, setTitleType] = useState<string | undefined>(undefined);
  const [transmission, setTransmission] = useState<string | undefined>(undefined);
  const [fuel, setFuel] = useState<string | undefined>(undefined);
  const [driveFilter, setDriveFilter] = useState<string | undefined>(undefined);
  const [cylinders, setCylinders] = useState<string | undefined>(undefined);
  const [locationFilter, setLocationFilter] = useState<string | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(36);
  const [, setPage] = useState(1);
  const [buyNowOnly, setBuyNowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [selectedMakeId, setSelectedMakeId] = useState<string>("all");
  const [selectedModelId, setSelectedModelId] = useState<string>("all");
  // Track make/model names for API filtering (from new vehicle-makes/models API)
  const [filterMakeName, setFilterMakeName] = useState<string | undefined>(undefined);
  const [filterModelName, setFilterModelName] = useState<string | undefined>(undefined);
  // Ref to always get latest filterMakeName in callbacks (avoids stale closure)
  const filterMakeNameRef = useRef<string | undefined>(undefined);
  const [_catalogMakes, setCatalogMakes] = useState<CatalogMake[]>([]);
  const [_catalogModels, setCatalogModels] = useState<CatalogModel[]>([]);
  const [_isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [_isLoadingModels, setIsLoadingModels] = useState(false);
  const [searchKind, setSearchKind] = useState<"all" | "car" | "moto" | "van">(
    "all"
  );
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

  const [backendData, setBackendData] = useState<SearchVehiclesResponse | null>(
    null
  );
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    (VehiclesSearchFilters & { page: number; limit: number }) | null
  >(null);
  const [appliedPage, setAppliedPage] = useState(1);
  const [extraLoaded, setExtraLoaded] = useState<{
    startPage: number;
    endPage: number;
    items: BackendItem[];
  } | null>(null);
  const [_isAdvancedFiltersOpen, _setIsAdvancedFiltersOpen] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResult, setCompareResult] =
    useState<VehiclesCompareResponse | null>(null);
  const [showCompareCheckboxes, _setShowCompareCheckboxes] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { isWatched, toggleWatch } = useVehicleWatchlist();
  const { isAuthenticated } = useAuth();
  const {
    data: calcData,
    isLoading: isCalcLoading,
    error: calcError,
    calculateQuotes,
  } = useCalculateVehicleQuotes();
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1280;
  });

  const hasInitializedFromUrl = useRef(false);

  const displayedItems: BackendItem[] = useMemo(
    () => (extraLoaded ? extraLoaded.items : backendData?.items ?? []),
    [extraLoaded, backendData?.items]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      sale_info: isLargeScreen,
    }));
  }, [isLargeScreen]);

  // Create table columns and instance
  const columns = useMemo(() => createColumns(
    showCompareCheckboxes,
    selectedVehicleIds,
    (item: BackendItem, checked: boolean) => {
      const id = item.vehicle_id ?? item.id;
      const isMobile = window.innerWidth < 640;
      const maxCompare = isMobile ? 2 : 5;
      setSelectedVehicleIds((prev) =>
        checked
          ? prev.length < maxCompare
            ? [...prev, id]
            : prev
          : prev.filter((pid) => pid !== id)
      );
    },
    (item: BackendItem) => {
      const id = item.vehicle_id ?? item.id;
      if (!isAuthenticated) {
        setIsAuthDialogOpen(true);
        return;
      }
      toggleWatch(id);
    },
    (item: BackendItem) => {
      const id = item.vehicle_id ?? item.id;
      navigate({ pathname: `/vehicle/${id}` });
    },
    (id: number) => isWatched(id),
    t,
    localeList,
    isGeorgian,
    monthShortKa,
    isLargeScreen,
  ), [showCompareCheckboxes, selectedVehicleIds, isAuthenticated, toggleWatch, navigate, isWatched, t, localeList, isGeorgian, monthShortKa, isLargeScreen]);

  const table = useReactTable({
    data: displayedItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const vehicleCatalogType: VehicleCatalogType = useMemo(() => {
    if (searchKind === "moto") {
      return "motorcycle";
    }

    return "car";
  }, [searchKind]);



  const updateUrlFromFilters = (
    filters: VehiclesSearchFilters & { page?: number; limit?: number },
    options?: { replace?: boolean }
  ) => {
    const searchParams = new URLSearchParams();

    if (filters.search && filters.search.trim().length > 0) {
      searchParams.set("q", filters.search.trim());
    }

    if (filters.make) {
      searchParams.set("make", filters.make);
    }

    if (filters.model) {
      searchParams.set("model", filters.model);
    }

    if (filters.source) {
      searchParams.set("source", filters.source);
    }

    if (filters.fuel_type) {
      searchParams.set("fuel_type", filters.fuel_type);
    }

    if (filters.category) {
      searchParams.set("category", filters.category);
    }

    if (filters.drive) {
      searchParams.set("drive", filters.drive);
    }

    if (typeof filters.year === "number" && filters.year > 0) {
      searchParams.set("year", String(filters.year));
    }

    if (typeof filters.year_from === "number" && filters.year_from > 0) {
      searchParams.set("year_from", String(filters.year_from));
    }

    if (typeof filters.year_to === "number" && filters.year_to > 0) {
      searchParams.set("year_to", String(filters.year_to));
    }

    if (typeof filters.mileage_from === "number" && filters.mileage_from > 0) {
      searchParams.set("mileage_from", String(filters.mileage_from));
    }

    if (typeof filters.mileage_to === "number" && filters.mileage_to > 0) {
      searchParams.set("mileage_to", String(filters.mileage_to));
    }

    if (typeof filters.price_from === "number" && filters.price_from > 0) {
      searchParams.set("price_from", String(filters.price_from));
    }

    if (typeof filters.price_to === "number" && filters.price_to > 0) {
      searchParams.set("price_to", String(filters.price_to));
    }

    if (filters.buy_now) {
      searchParams.set("buy_now", "true");
    }

    if (filters.title_type) {
      searchParams.set("title_type", filters.title_type);
    }

    if (filters.transmission) {
      searchParams.set("transmission", filters.transmission);
    }

    if (filters.fuel) {
      searchParams.set("fuel", filters.fuel);
    }

    if (filters.drive) {
      searchParams.set("drive", filters.drive);
    }

    if (filters.cylinders) {
      searchParams.set("cylinders", filters.cylinders);
    }

    if (filters.location) {
      searchParams.set("location", filters.location);
    }

    if (filters.source) {
      searchParams.set("source", filters.source);
    }

    if (filters.buy_now) {
      searchParams.set("buy_now", "true");
    }

    if (filters.date) {
      searchParams.set("date", filters.date);
    }

    if (filters.sort) {
      searchParams.set("sort", filters.sort);
    }

    const effectiveLimit = filters.limit ?? 36;
    if (effectiveLimit !== 36) {
      searchParams.set("limit", String(effectiveLimit));
    }

    const effectivePage = filters.page ?? 1;
    if (effectivePage > 1) {
      searchParams.set("page", String(effectivePage));
    }

    const searchString = searchParams.toString();
    const newSearch = searchString.length > 0 ? `?${searchString}` : "";

    if (typeof window !== "undefined") {
      const newUrl = `${location.pathname}${newSearch}`;
      if (options?.replace ?? true) {
        window.history.replaceState(null, "", newUrl);
      } else {
        window.history.pushState(null, "", newUrl);
      }
    }
  };

  // Legacy wrapper that reads from state - used by applyFilters and pagination
  const updateUrlFromState = (options?: {
    page?: number;
    limit?: number;
    replace?: boolean;
    searchQueryOverride?: string;
  }) => {
    const filters = buildFiltersFromDraftState({
      searchQuery: options?.searchQueryOverride ?? searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit: options?.limit ?? limit,
      page: options?.page ?? appliedPage ?? 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      location: locationFilter,
      sourceFilter,
      dateFilter,
    });

    updateUrlFromFilters(filters, { replace: options?.replace ?? true });
  };

  const activeFilterLabels = useMemo(() => {
    const labels: { id: string; label: string }[] = [];
    if (!appliedFilters) {
      return labels;
    }

    if (appliedFilters.search && appliedFilters.search.trim().length > 0) {
      labels.push({
        id: "search",
        label: `${t("common.search")}: ${appliedFilters.search.trim()}`,
      });
    }

    if (appliedFilters.source) {
      let auctionLabel = appliedFilters.source;
      const srcLower = appliedFilters.source.toLowerCase();
      if (srcLower === "copart") auctionLabel = "Copart";
      else if (srcLower === "iaai") auctionLabel = "IAAI";

      labels.push({
        id: "auction",
        label: `${t("auction.filters.auction")}: ${auctionLabel}`,
      });
    }

    // Fuel filter chip - handles both fuel_type (legacy) and fuel (new comma-separated)
    if (appliedFilters.fuel_type || appliedFilters.fuel) {
      const fuelValue = appliedFilters.fuel || appliedFilters.fuel_type || "";
      const fuelTypes = fuelValue.split(",").map((f) => f.trim().toLowerCase()).filter(Boolean);

      const fuelLabels = fuelTypes.map((fuelType) => {
        switch (fuelType) {
          case "petrol":
            return t("common.fuel_gas");
          case "diesel":
            return t("common.fuel_diesel");
          case "hybrid":
            return t("common.fuel_hybrid");
          case "electric":
            return t("common.fuel_electric");
          case "flexible":
            return t("common.fuel_flexible");
          default:
            return fuelType;
        }
      });

      if (fuelLabels.length > 0) {
        labels.push({
          id: "fuel",
          label: `${t("auction.filters.fuel")}: ${fuelLabels.join(", ")}`,
        });
      }
    }

    if (appliedFilters.buy_now) {
      labels.push({ id: "buyNow", label: t("auction.filters.buy_now_only") });
    }

    if (appliedFilters.make) {
      labels.push({
        id: "make",
        label: `${t("auction.filters.make")}: ${appliedFilters.make}`,
      });
    }

    if (appliedFilters.model) {
      labels.push({
        id: "model",
        label: `${t("auction.filters.model")}: ${appliedFilters.model}`,
      });
    }

    if (appliedFilters.category) {
      let categoryLabel: string;
      if (appliedFilters.category === "v") {
        categoryLabel = t("common.cars");
      } else if (appliedFilters.category === "c") {
        categoryLabel = t("common.motorcycles");
      } else if (appliedFilters.category === "v,c" || appliedFilters.category === "c,v") {
        categoryLabel = `${t("common.cars")} & ${t("common.motorcycles")}`;
      } else {
        categoryLabel = appliedFilters.category;
      }

      labels.push({
        id: "category",
        label: `${t("auction.filters.category")}: ${categoryLabel}`,
      });
    }

    if (appliedFilters.drive) {
      let driveLabel: string;
      switch (appliedFilters.drive) {
        case "front":
          driveLabel = "Front wheel drive";
          break;
        case "rear":
          driveLabel = "Rear wheel drive";
          break;
        case "full":
          driveLabel = "All wheel drive";
          break;
        default:
          driveLabel = appliedFilters.drive;
          break;
      }

      labels.push({
        id: "drive",
        label: `${t("common.drive")}: ${driveLabel}`,
      });
    }

    if (typeof appliedFilters.year === "number") {
      labels.push({
        id: "yearExact",
        label: `${t("auction.filters.year")}: ${appliedFilters.year}`,
      });
    } else if (
      typeof appliedFilters.year_from === "number" ||
      typeof appliedFilters.year_to === "number"
    ) {
      const from = appliedFilters.year_from ?? 0;
      const to = appliedFilters.year_to ?? 0;
      // Only show chip if at least one value is meaningful (not 0)
      if (from > 0 || to > 0) {
        labels.push({
          id: "yearRange",
          label: `${t("auction.filters.year")}: ${from || "?"}-${to || "?"}`,
        });
      }
    }

    if (
      typeof appliedFilters.price_from === "number" ||
      typeof appliedFilters.price_to === "number"
    ) {
      const from = appliedFilters.price_from ?? 0;
      const to = appliedFilters.price_to ?? 0;
      // Only show chip if at least one value is meaningful (not 0)
      if (from > 0 || to > 0) {
        const fromDisplay = from > 0 ? `$${from.toLocaleString()}` : "$0";
        const toDisplay = to > 0 ? `$${to.toLocaleString()}` : "∞";
        labels.push({
          id: "price",
          label: `${t("auction.filters.price")}: ${fromDisplay} – ${toDisplay}`,
        });
      }
    }

    if (
      typeof appliedFilters.mileage_from === "number" ||
      typeof appliedFilters.mileage_to === "number"
    ) {
      const from = appliedFilters.mileage_from ?? 0;
      const to = appliedFilters.mileage_to ?? 0;
      // Only show chip if at least one value is meaningful (not 0)
      if (from > 0 || to > 0) {
        const fromDisplay = from > 0 ? from.toLocaleString() : "0";
        const toDisplay = to > 0 ? to.toLocaleString() : "∞";
        labels.push({
          id: "mileage",
          label: `${t("auction.filters.mileage")}: ${fromDisplay} – ${toDisplay}`,
        });
      }
    }

    // Title type filter chip
    if (appliedFilters.title_type) {
      const titleTypes = appliedFilters.title_type.split(",").map((t) => t.trim());
      const titleLabels = titleTypes.map((type) => {
        const lower = type.toLowerCase();
        if (lower === "clean title") return "Clean";
        if (lower === "salvage title") return "Salvage";
        if (lower === "nonrepairable") return "Non-repairable";
        return type;
      });
      labels.push({
        id: "titleType",
        label: `${t("auction.filters.title_type")}: ${titleLabels.join(", ")}`,
      });
    }

    // Transmission filter chip
    if (appliedFilters.transmission) {
      const transmissionTypes = appliedFilters.transmission.split(",").map((t) => t.trim().toLowerCase());
      const transmissionLabels = transmissionTypes.map((type) => {
        if (type === "auto") return "Automatic";
        if (type === "manual") return "Manual";
        return type;
      });
      labels.push({
        id: "transmission",
        label: `${t("auction.filters.transmission")}: ${transmissionLabels.join(", ")}`,
      });
    }

    // Cylinders filter chip
    if (appliedFilters.cylinders) {
      const cylinderValues = appliedFilters.cylinders.split(",").map((c) => c.trim().toUpperCase());
      const cylinderLabels = cylinderValues.map((c) => (c === "U" ? "Unknown" : c));
      labels.push({
        id: "cylinders",
        label: `${t("auction.filters.cylinders")}: ${cylinderLabels.join(", ")}`,
      });
    }

    // Location filter chip
    if (appliedFilters.location) {
      labels.push({
        id: "location",
        label: `${t("auction.filters.location")}: ${appliedFilters.location}`,
      });
    }

    // Sort filter chip
    if (appliedFilters.sort) {
      let sortLabel: string;
      switch (appliedFilters.sort) {
        case "price_asc":
          sortLabel = t("sort.price_asc");
          break;
        case "price_desc":
          sortLabel = t("sort.price_desc");
          break;
        case "year_asc":
          sortLabel = t("sort.year_asc");
          break;
        case "year_desc":
          sortLabel = t("sort.year_desc");
          break;
        case "mileage_asc":
          sortLabel = t("sort.mileage_asc");
          break;
        case "mileage_desc":
          sortLabel = t("sort.mileage_desc");
          break;
        case "sold_date_asc":
          sortLabel = t("sort.sold_date_asc");
          break;
        case "sold_date_desc":
          sortLabel = t("sort.sold_date_desc");
          break;
        case "best_value":
          sortLabel = t("sort.best_value");
          break;
        default:
          sortLabel = appliedFilters.sort;
      }
      labels.push({
        id: "sort",
        label: `${t("common.sort_by")}: ${sortLabel}`,
      });
    }

    return labels;
  }, [appliedFilters, t]);

  useEffect(() => {
    if (hasInitializedFromUrl.current) {
      return;
    }
    hasInitializedFromUrl.current = true;

    const params = new URLSearchParams(location.search);

    // Parse all URL parameters into state values
    const nextSearchQuery = params.get("q") || "";
    const kindParam = params.get("kind");
    const nextSearchKind =
      kindParam === "all" ||
        kindParam === "car" ||
        kindParam === "moto" ||
        kindParam === "van"
        ? kindParam
        : "all";

    // Prefer new `source` param (copart/iaai), fall back to legacy `auction`
    const sourceParam = params.get("source");
    const auctionParam = params.get("auction");
    let nextAuctionFilter: AuctionHouse = "all";
    if (sourceParam) {
      const src = sourceParam.toLowerCase();
      if (src === "copart") nextAuctionFilter = "Copart";
      else if (src === "iaai") nextAuctionFilter = "IAAI";
    } else if (
      auctionParam === "all" ||
      auctionParam === "Copart" ||
      auctionParam === "IAAI"
    ) {
      nextAuctionFilter = auctionParam as AuctionHouse;
    }

    const fuelParam = params.get("fuel_type");
    const nextFuelType =
      fuelParam &&
        ["all", "petrol", "diesel", "hybrid", "electric", "flexible"].includes(
          fuelParam
        )
        ? fuelParam
        : "all";

    const categoryParam = params.get("category");
    const nextCategory =
      categoryParam && ["all", "v", "c", "a", "v,c", "c,v"].includes(categoryParam)
        ? categoryParam
        : "all";

    const driveParam = params.get("drive");
    const nextDrive =
      driveParam && ["all", "front", "rear", "full"].includes(driveParam)
        ? driveParam
        : "all";

    // Title type filter - comma-separated, validated against allowed values
    const titleTypeParam = params.get("title_type");
    const allowedTitleTypes = ["clean title", "nonrepairable", "salvage title"];
    const nextTitleType = (() => {
      if (!titleTypeParam) return undefined;
      const values = titleTypeParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedTitleTypes.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Transmission filter - validated against allowed values
    const transmissionParam = params.get("transmission");
    const allowedTransmissions = ["auto", "manual"];
    const nextTransmission = (() => {
      if (!transmissionParam) return undefined;
      const values = transmissionParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedTransmissions.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Fuel filter - validated against allowed values
    const fuelFilterParam = params.get("fuel");
    const allowedFuels = ["petrol", "diesel", "electric", "flexible", "hybrid"];
    const nextFuel = (() => {
      if (!fuelFilterParam) return undefined;
      const values = fuelFilterParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedFuels.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Drive filter - validated against allowed values
    const driveFilterParam = params.get("drive");
    const allowedDrives = ["front", "rear", "full"];
    const nextDriveFilter = (() => {
      if (!driveFilterParam) return undefined;
      const values = driveFilterParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedDrives.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Cylinders filter - validated against allowed values
    const cylindersParam = params.get("cylinders");
    const allowedCylinders = ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "u"];
    const nextCylinders = (() => {
      if (!cylindersParam) return undefined;
      const values = cylindersParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedCylinders.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Location filter - city name from URL
    const locationParam = params.get("location");
    const nextLocation = locationParam || undefined;

    // Source filter - copart, iaai or both (multi-value)
    const sourceFilterParam = params.get("source");
    const allowedSources = ["copart", "iaai"];
    const nextSourceFilter = (() => {
      if (!sourceFilterParam) return undefined;
      const values = sourceFilterParam.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
      const validValues = values.filter((v) => allowedSources.includes(v));
      return validValues.length > 0 ? validValues.join(",") : undefined;
    })();

    // Date filter - exact date in YYYY-MM-DD format
    const dateParam = params.get("date");
    const nextDateFilter = (() => {
      if (!dateParam) return undefined;
      // Validate YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return undefined;
      return dateParam;
    })();

    // Year range – default is "no filter" [0, 0]
    const yearFromParam = params.get("year_from");
    const yearToParam = params.get("year_to");
    const nextYearRange = (() => {
      const from = yearFromParam ? Number(yearFromParam) : 0;
      const to = yearToParam ? Number(yearToParam) : 0;
      return Number.isFinite(from) && Number.isFinite(to) ? [from, to] : [0, 0];
    })();

    // Exact year
    const yearExactParam = params.get("year");
    const nextExactYear =
      yearExactParam !== null && yearExactParam !== ""
        ? (() => {
          const parsed = Number(yearExactParam);
          return Number.isNaN(parsed) ? "" : parsed;
        })()
        : "";

    // Mileage range – default is "no filter" [0, 0]
    const mileageFromParam = params.get("mileage_from");
    const mileageToParam = params.get("mileage_to");
    const nextMileageRange = (() => {
      const from = mileageFromParam ? Number(mileageFromParam) : 0;
      const to = mileageToParam ? Number(mileageToParam) : 0;
      return Number.isFinite(from) && Number.isFinite(to) ? [from, to] : [0, 0];
    })();

    // Price range – default is "no filter" [0, 0]
    const priceMinParam = params.get("price_from");
    const priceMaxParam = params.get("price_to");
    const nextPriceRange = (() => {
      const min = priceMinParam ? Number(priceMinParam) : 0;
      const max = priceMaxParam ? Number(priceMaxParam) : 0;
      return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : [0, 0];
    })();

    // Buy Now Only flag
    const buyNowParam = params.get("buy_now");
    const nextBuyNowOnly = buyNowParam === "true";

    // Sort
    const sortParam = params.get("sort") as SortOption | null;
    const validSorts: SortOption[] = [
      "none",
      "price_asc",
      "price_desc",
      "year_desc",
      "year_asc",
      "mileage_asc",
      "mileage_desc",
      "sold_date_desc",
      "sold_date_asc",
      "best_value",
    ];
    const nextSortBy =
      sortParam && validSorts.includes(sortParam) ? sortParam : "none";

    // Limit
    const limitParam = params.get("limit");
    const nextLimit = limitParam
      ? (() => {
        const parsed = Number(limitParam);
        return [12, 24, 36, 60].includes(parsed) ? parsed : 36;
      })()
      : 36;

    // Page
    const pageParam = params.get("page");
    const nextPage = pageParam
      ? (() => {
        const parsed = Number(pageParam);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
      })()
      : 1;

    // Optional make/model from URL (used for deep links)
    const urlMake = params.get("make") || undefined;
    const urlModel = params.get("model") || undefined;

    // Build filters (URL `make`/`model` take precedence on first load)
    const filters = buildFiltersFromDraftState({
      searchQuery: nextSearchQuery,
      exactYear: nextExactYear,
      mileageRange: nextMileageRange,
      priceRange: nextPriceRange,
      yearRange: nextYearRange,
      fuelType: nextFuelType,
      category: nextCategory,
      drive: nextDrive,
      limit: nextLimit,
      page: nextPage,
      searchKind: nextSearchKind,
      auctionFilter: nextAuctionFilter,
      buyNowOnly: nextBuyNowOnly,
      selectedMakeName: urlMake ?? filterMakeName,
      selectedModelName: urlModel ?? filterModelName,
      sort: nextSortBy,
      titleType: nextTitleType,
      transmission: nextTransmission,
      fuel: nextFuel,
      driveFilter: nextDriveFilter,
      cylinders: nextCylinders ? nextCylinders.toUpperCase() : undefined,
      location: nextLocation,
      sourceFilter: nextSourceFilter,
      dateFilter: nextDateFilter,
    });

    // Set all state values
    setSearchQuery(nextSearchQuery);
    setSearchKind(nextSearchKind);
    setAuctionFilter(nextAuctionFilter);
    setFuelType(nextFuelType);
    setCategory(nextCategory);
    setDrive(nextDrive);
    setTitleType(nextTitleType);
    setTransmission(nextTransmission);
    setFuel(nextFuel);
    setDriveFilter(nextDriveFilter);
    setCylinders(nextCylinders ? nextCylinders.toUpperCase() : undefined);
    setLocationFilter(nextLocation);
    setSourceFilter(nextSourceFilter);
    setDateFilter(nextDateFilter);
    setYearRange(nextYearRange);
    setExactYear(nextExactYear);
    setMileageRange(nextMileageRange);
    setPriceRange(nextPriceRange);
    setSortBy(nextSortBy);
    setBuyNowOnly(nextBuyNowOnly);
    setLimit(nextLimit);
    setPage(nextPage);
    // Sync make/model names from URL
    if (urlMake) {
      setFilterMakeName(urlMake);
      filterMakeNameRef.current = urlMake;
    }
    if (urlModel) setFilterModelName(urlModel);
    setAppliedFilters(filters);
    setAppliedPage(filters.page);
    setExtraLoaded(null);
  }, [location.search, filterMakeName, filterModelName]);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingMakes(true);

    fetchCatalogMakes(vehicleCatalogType)
      .then((items) => {
        if (!isMounted) return;
        setCatalogMakes(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogMakes([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingMakes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicleCatalogType]);

  useEffect(() => {
    if (selectedMakeId === "all") {
      setCatalogModels([]);
      return;
    }

    let isMounted = true;

    const parsedMakeId = Number.parseInt(selectedMakeId, 10);
    if (!Number.isFinite(parsedMakeId) || parsedMakeId <= 0) {
      setCatalogModels([]);
      return;
    }

    setIsLoadingModels(true);

    fetchCatalogModels(parsedMakeId, vehicleCatalogType)
      .then((items) => {
        if (!isMounted) return;
        setCatalogModels(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogModels([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingModels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMakeId, vehicleCatalogType]);

  useEffect(() => {
    if (!appliedFilters) {
      return;
    }

    let isMounted = true;
    setIsBackendLoading(true);
    setBackendError(null);

    searchVehicles(appliedFilters)
      .then((result) => {
        if (!isMounted) return;
        setBackendData(result);
        setExtraLoaded(null);
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setBackendError(error.message || "Failed to load vehicles");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsBackendLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  const maxAvailablePage = useMemo(() => {
    if (!backendData) return 1;
    return (
      backendData.totalPages ??
      Math.max(
        1,
        Math.ceil(backendData.total / (appliedFilters?.limit || limit))
      )
    );
  }, [backendData, appliedFilters, limit]);

  const currentWindowEndPage = extraLoaded ? extraLoaded.endPage : appliedPage;
  const canLoadMore = !!backendData && currentWindowEndPage < maxAvailablePage;

  useEffect(() => {
    if (!backendData && !isBackendLoading && !backendError) {
      return;
    }
  }, [appliedFilters, isBackendLoading, backendError, backendData]);

  // Handler for category filter changes - triggers immediate data fetch
  const handleCategoryChange = (newCategory: CategoryFilter) => {
    // Convert CategoryFilter to the category string used in state/API
    const categoryValue = newCategory ?? "all";
    setCategory(categoryValue);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category: categoryValue,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for year range filter changes - triggers immediate data fetch
  const handleYearRangeChange = (yearFrom: number, yearTo: number) => {
    const newYearRange: [number, number] = [yearFrom, yearTo];
    setYearRange(newYearRange);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange: newYearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for odometer/mileage range filter changes - triggers immediate data fetch
  const handleOdometerRangeChange = (odometerFrom: number, odometerTo: number) => {
    const newMileageRange: [number, number] = [odometerFrom, odometerTo];
    setMileageRange(newMileageRange);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange: newMileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for price range filter changes - triggers immediate data fetch
  const handlePriceRangeChange = (priceFrom: number, priceTo: number) => {
    const newPriceRange: [number, number] = [priceFrom, priceTo];
    setPriceRange(newPriceRange);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange: newPriceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for title type filter changes - triggers immediate data fetch
  const handleTitleTypeChange = (newTitleType: string | undefined) => {
    setTitleType(newTitleType);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType: newTitleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for transmission filter changes - triggers immediate data fetch
  const handleTransmissionChange = (newTransmission: string | undefined) => {
    setTransmission(newTransmission);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission: newTransmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for fuel filter changes - triggers immediate data fetch
  const handleFuelChange = (newFuel: string | undefined) => {
    setFuel(newFuel);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel: newFuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for drive filter changes - triggers immediate data fetch
  const handleDriveFilterChange = (newDrive: string | undefined) => {
    setDriveFilter(newDrive);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter: newDrive,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for location filter changes - triggers immediate data fetch
  const handleLocationChange = (newLocation: string | undefined) => {
    setLocationFilter(newLocation);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: newLocation,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for cylinders filter changes - triggers immediate data fetch
  const handleCylindersChange = (newCylinders: string | undefined) => {
    setCylinders(newCylinders);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders: newCylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for source filter changes - triggers immediate data fetch
  const handleSourceChange = (newSource: string | undefined) => {
    setSourceFilter(newSource);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter: newSource,
      dateFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for date filter changes - triggers immediate data fetch
  const handleDateChange = (newDate: string | undefined) => {
    setDateFilter(newDate);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
      dateFilter: newDate,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for buy now filter changes - triggers immediate data fetch
  const handleBuyNowChange = (newBuyNow: boolean) => {
    setBuyNowOnly(newBuyNow);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly: newBuyNow,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
      dateFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for make filter changes - triggers immediate data fetch
  const handleMakeChange = (makeId: number | undefined, makeName: string | undefined) => {
    // Update state - use string "all" for undefined to match existing state type
    setSelectedMakeId(makeId ? String(makeId) : "all");
    setFilterMakeName(makeName);
    filterMakeNameRef.current = makeName; // Keep ref in sync for model handler
    // Clear model when make changes
    setSelectedModelId("all");
    setFilterModelName(undefined);
    setCatalogModels([]);

    // Build and apply filters immediately
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: makeName,
      selectedModelName: undefined,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Handler for model filter changes - triggers immediate data fetch
  const handleModelChange = (modelId: number | undefined, modelName: string | undefined) => {
    // Update state
    setSelectedModelId(modelId ? String(modelId) : "all");
    setFilterModelName(modelName);

    // Build and apply filters immediately - use ref for current make (avoids stale closure)
    const currentMakeName = filterMakeNameRef.current;
    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: currentMakeName,
      selectedModelName: modelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  const applyFilters = () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      return;
    }

    const draft: DraftFiltersInput = {
      searchQuery,
      exactYear,
      mileageRange,
      priceRange,
      yearRange,
      fuelType,
      category,
      drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter,
      buyNowOnly,
      selectedMakeName: filterMakeName,
      selectedModelName: filterModelName,
      sort: sortBy,
      titleType,
      transmission,
      fuel,
      driveFilter,
      cylinders,
      location: locationFilter,
      sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);
    _setIsAdvancedFiltersOpen(false);

    updateUrlFromFilters(nextFilters, { replace: false });
  };


  const resetFilters = () => {
    const defaultYearRange: [number, number] = [0, 0];
    const defaultPriceRange: [number, number] = [0, 0];
    const defaultMileageRange: [number, number] = [0, 0];

    setAuctionFilter("all");
    setStatusFilter("all");
    setDamageFilter("all");
    setPriceRange(defaultPriceRange);
    setYearRange(defaultYearRange);
    setMileageRange(defaultMileageRange);
    setExactYear("");
    setFuelType("all");
    setCategory("all");
    setDrive("all");
    setTitleType(undefined);
    setTransmission(undefined);
    setFuel(undefined);
    setDriveFilter(undefined);
    setCylinders(undefined);
    setLocationFilter(undefined);
    setSourceFilter(undefined);
    setDateFilter(undefined);
    setLimit(36);
    setPage(1);
    setBuyNowOnly(false);
    setSearchQuery("");
    setSortBy("none");
    setSelectedMakeId("all");
    setSelectedModelId("all");
    setFilterMakeName(undefined);
    setFilterModelName(undefined);
    filterMakeNameRef.current = undefined;
    setBackendData(null);
    setBackendError(null);

    const draft: DraftFiltersInput = {
      searchQuery: "",
      exactYear: "",
      mileageRange: defaultMileageRange,
      priceRange: defaultPriceRange,
      yearRange: defaultYearRange,
      fuelType: "all",
      category: "all",
      drive: "all",
      limit: 36,
      page: 1,
      searchKind: "all",
      auctionFilter: "all",
      buyNowOnly: false,
      selectedMakeName: undefined,
      selectedModelName: undefined,
      sort: "none",
      titleType: undefined,
      transmission: undefined,
      fuel: undefined,
      driveFilter: undefined,
      cylinders: undefined,
      location: undefined,
      sourceFilter: undefined,
      dateFilter: undefined,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setAppliedFilters(nextFilters);
    setAppliedPage(1);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  const handleRemoveFilter = (id: string) => {
    switch (id) {
      case "search":
        setSearchQuery("");
        break;
      case "auction":
        setAuctionFilter("all");
        setSourceFilter(undefined);
        break;
      case "fuel":
        setFuelType("all");
        setFuel(undefined);
        break;
      case "category":
        setCategory("all");
        break;
      case "buyNow":
        setBuyNowOnly(false);
        break;
      case "make":
        setSelectedMakeId("all");
        setSelectedModelId("all");
        setFilterMakeName(undefined);
        setFilterModelName(undefined);
        filterMakeNameRef.current = undefined;
        setCatalogModels([]);
        break;
      case "model":
        setSelectedModelId("all");
        setFilterModelName(undefined);
        break;
      case "yearExact":
        setExactYear("");
        break;
      case "yearRange":
        setYearRange([0, 0]);
        break;
      case "price":
        setPriceRange([0, 0]);
        break;
      case "mileage":
        setMileageRange([0, 0]);
        break;
      case "drive":
        setDrive("all");
        break;
      case "titleType":
        setTitleType(undefined);
        break;
      case "transmission":
        setTransmission(undefined);
        break;
      case "cylinders":
        setCylinders(undefined);
        break;
      case "location":
        setLocationFilter(undefined);
        break;
      case "sort":
        setSortBy("none");
        break;
      default:
        break;
    }

    const draft: DraftFiltersInput = {
      searchQuery: id === "search" ? "" : searchQuery,
      exactYear: id === "yearExact" ? "" : exactYear,
      mileageRange: id === "mileage" ? [0, 0] : mileageRange,
      priceRange: id === "price" ? [0, 0] : priceRange,
      yearRange: id === "yearRange" ? [0, 0] : yearRange,
      fuelType: id === "fuel" ? "all" : fuelType,
      category: id === "category" ? "all" : category,
      drive: id === "drive" ? "all" : drive,
      limit,
      page: 1,
      searchKind,
      auctionFilter: id === "auction" ? "all" : auctionFilter,
      buyNowOnly: id === "buyNow" ? false : buyNowOnly,
      selectedMakeName: id === "make" ? undefined : filterMakeName,
      selectedModelName: id === "make" || id === "model" ? undefined : filterModelName,
      sort: id === "sort" ? "none" : sortBy,
      titleType: id === "titleType" ? undefined : titleType,
      transmission: id === "transmission" ? undefined : transmission,
      fuel: id === "fuel" ? undefined : fuel,
      driveFilter: id === "driveFilter" ? undefined : driveFilter,
      cylinders: id === "cylinders" ? undefined : cylinders,
      location: id === "location" ? undefined : locationFilter,
      sourceFilter: id === "auction" ? undefined : sourceFilter,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    updateUrlFromFilters(nextFilters, { replace: false });
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <main
        className="flex-1 flex flex-col"
        role="main"
        aria-label={t("auction.active_auctions")}
      >
        <div className="flex-1 w-full px-2 lg:px-4 py-4 lg:py-8 lg:max-w-[1440px] lg:mx-auto">
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block lg:col-span-1">
              <AuctionSidebarFilters
                categoryFilter={category === 'all' ? undefined : category as CategoryFilter}
                onCategoryChange={handleCategoryChange}
                yearRange={yearRange as [number, number]}
                onYearRangeChange={handleYearRangeChange}
                selectedMakeId={selectedMakeId !== 'all' ? parseInt(selectedMakeId, 10) : undefined}
                onMakeChange={handleMakeChange}
                selectedModelId={selectedModelId !== 'all' ? parseInt(selectedModelId, 10) : undefined}
                onModelChange={handleModelChange}
                odometerRange={mileageRange as [number, number]}
                onOdometerRangeChange={handleOdometerRangeChange}
                priceRange={priceRange as [number, number]}
                onPriceRangeChange={handlePriceRangeChange}
                titleType={titleType}
                onTitleTypeChange={handleTitleTypeChange}
                transmission={transmission}
                onTransmissionChange={handleTransmissionChange}
                fuel={fuel}
                onFuelChange={handleFuelChange}
                drive={driveFilter}
                onDriveChange={handleDriveFilterChange}
                cylinders={cylinders}
                onCylindersChange={handleCylindersChange}
                location={locationFilter}
                onLocationChange={handleLocationChange}
                source={sourceFilter}
                onSourceChange={handleSourceChange}
                buyNow={buyNowOnly}
                onBuyNowChange={handleBuyNowChange}
                date={dateFilter}
                onDateChange={handleDateChange}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
              />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-4 space-y-6">
              {/* Search Bar + Mobile Filters (inline below 1024px) */}
              <div className="flex gap-1.5 sm:gap-2 items-stretch">
                <div className="relative flex-1 min-w-0">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400"
                  />
                  <Input
                    placeholder={t("auction.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters();
                    }}
                    className="pl-9 sm:pl-11 h-10 sm:h-11 text-sm sm:text-base bg-white border-slate-200 shadow-sm rounded-lg"
                  />
                </div>
                <Button
                  onClick={applyFilters}
                  className="h-10 sm:h-11 px-3 sm:px-6 bg-primary hover:bg-primary/90 text-white whitespace-nowrap text-sm sm:text-base"
                >
                  <Icon icon="mdi:magnify" className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">{t("common.search")}</span>
                </Button>
                {/* Mobile Filters Trigger - inline with search on small screens */}
                <div className="lg:hidden flex items-stretch">
                  <AuctionFiltersDrawer
                    showLabel={false}
                    categoryFilter={category === 'all' ? undefined : category as CategoryFilter}
                    onCategoryChange={handleCategoryChange}
                    yearRange={yearRange as [number, number]}
                    onYearRangeChange={handleYearRangeChange}
                    selectedMakeId={selectedMakeId !== 'all' ? parseInt(selectedMakeId, 10) : undefined}
                    onMakeChange={handleMakeChange}
                    selectedModelId={selectedModelId !== 'all' ? parseInt(selectedModelId, 10) : undefined}
                    onModelChange={handleModelChange}
                    odometerRange={mileageRange as [number, number]}
                    onOdometerRangeChange={handleOdometerRangeChange}
                    priceRange={priceRange as [number, number]}
                    onPriceRangeChange={handlePriceRangeChange}
                    titleType={titleType}
                    onTitleTypeChange={handleTitleTypeChange}
                    transmission={transmission}
                    onTransmissionChange={handleTransmissionChange}
                    fuel={fuel}
                    onFuelChange={handleFuelChange}
                    drive={driveFilter}
                    onDriveChange={handleDriveFilterChange}
                    cylinders={cylinders}
                    onCylindersChange={handleCylindersChange}
                    location={locationFilter}
                    onLocationChange={handleLocationChange}
                    source={sourceFilter}
                    onSourceChange={handleSourceChange}
                    buyNow={buyNowOnly}
                    onBuyNowChange={handleBuyNowChange}
                    date={dateFilter}
                    onDateChange={handleDateChange}
                    onApplyFilters={applyFilters}
                    onResetFilters={resetFilters}
                  />
                </div>
              </div>

              {/* Active Filter Chips */}
              <AnimatePresence>
                {activeFilterLabels.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-1 md:gap-2"
                  >
                    {activeFilterLabels.map((tag) => (
                      <Button
                        key={tag.id}
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 md:h-7 md:text-xs md:px-3 rounded-full border-primary/50 bg-primary/10 text-primary font-medium gap-0.5 md:gap-1 hover:bg-primary/20"
                        onClick={() => handleRemoveFilter(tag.id)}
                      >
                        {tag.label}
                        <Icon icon="mdi:close" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      onClick={resetFilters}
                      className="h-6 text-[10px] px-2 md:h-7 md:text-xs md:px-3 rounded-full bg-accent hover:bg-accent/90 text-primary font-medium"
                    >
                      {t("common.clear_all")}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results Header (counts only in subtitle) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {t("auction.real_results")}
                  </h2>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                    {isBackendLoading && t("auction.loading_data")}
                    {!isBackendLoading &&
                      !backendError &&
                      backendData && (
                        <>
                          <span>{t("auction.showing_prefix")}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                            {displayedItems.length}
                          </span>
                          <span>{t("auction.showing_middle")}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                            {backendData.total}
                          </span>
                          <span>{t("auction.showing_suffix")}</span>
                        </>
                      )}
                  </p>
                </div>

                <div className="flex items-center gap-2">


                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {t("common.sort_by")}
                  </span>
                  <Select
                    value={sortBy}
                    onValueChange={(val) => {
                      const newSort = val as SortOption;
                      setSortBy(newSort);
                      // Immediately apply the sort change
                      const draft: DraftFiltersInput = {
                        searchQuery,
                        exactYear,
                        mileageRange,
                        priceRange,
                        yearRange,
                        fuelType,
                        category,
                        drive,
                        limit,
                        page: 1,
                        searchKind,
                        auctionFilter,
                        buyNowOnly,
                        selectedMakeName: filterMakeName,
                        selectedModelName: filterModelName,
                        sort: newSort,
                        titleType,
                        transmission,
                        fuel,
                        driveFilter,
                        cylinders,
                        location: locationFilter,
                        sourceFilter,
                      };
                      const nextFilters = buildFiltersFromDraftState(draft);
                      setPage(1);
                      setAppliedPage(1);
                      setAppliedFilters(nextFilters);
                      setExtraLoaded(null);
                      updateUrlFromFilters(nextFilters, { replace: false });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm w-auto min-w-[160px] px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("sort.none")}</SelectItem>
                      <SelectItem value="best_value">
                        {t("sort.best_value")}
                      </SelectItem>
                      <SelectItem value="price_asc">
                        {t("sort.price_low")}
                      </SelectItem>
                      <SelectItem value="price_desc">
                        {t("sort.price_high")}
                      </SelectItem>
                      <SelectItem value="year_desc">
                        {t("sort.year_new")}
                      </SelectItem>
                      <SelectItem value="year_asc">
                        {t("sort.year_old")}
                      </SelectItem>
                      <SelectItem value="mileage_asc">
                        {t("sort.mileage_low")}
                      </SelectItem>
                      <SelectItem value="mileage_desc">
                        {t("sort.mileage_high")}
                      </SelectItem>
                      <SelectItem value="sold_date_desc">
                        {t("sort.sold_date_desc")}
                      </SelectItem>
                      <SelectItem value="sold_date_asc">
                        {t("sort.sold_date_asc")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle - Desktop only (md and up) */}
                  <div className="hidden md:flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                    <Button
                      size="sm"
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      className="h-7 px-2"
                      onClick={() => setViewMode('table')}
                      aria-label="Table view"
                    >
                      <Icon icon="mdi:table" className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      className="h-7 px-2"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                    >
                      <Icon icon="mdi:view-grid" className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Compare feature hidden for now */}
                </div>
              </div>

              {/* Content Grid */}
              <div className="min-h-[400px]">
                {isBackendLoading && displayedItems.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Card
                        key={i}
                        className="overflow-hidden rounded-xl border-border/50 flex flex-row sm:flex-col"
                      >
                        <Skeleton className="w-28 h-20 sm:w-full sm:aspect-[4/3] sm:h-auto flex-shrink-0" />
                        <CardContent className="p-2 sm:p-4 space-y-1 sm:space-y-3 flex-1">
                          <Skeleton className="h-4 sm:h-5 w-3/4" />
                          <Skeleton className="h-3 sm:h-4 w-1/2" />
                          <div className="flex justify-between pt-1 sm:pt-2">
                            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                            <Skeleton className="h-6 sm:h-8 w-14 sm:w-8 rounded-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : backendError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-xl bg-destructive/5 border-destructive/20">
                    <Icon
                      icon="mdi:alert-circle-outline"
                      className="w-12 h-12 text-destructive"
                    />
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-destructive">
                        {t("error.failed_to_load_data")}
                      </h3>
                      <p className="text-muted-foreground">{backendError}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setAppliedFilters({ ...appliedFilters! })}
                    >
                      {t("common.retry")}
                    </Button>
                  </div>
                ) : displayedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-xl bg-muted/30 border-dashed">
                    <Icon
                      icon="mdi:car-off"
                      className="w-12 h-12 text-muted-foreground/50"
                    />
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">
                        {t("auction.no_results")}
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {t("auction.try_resetting")}
                      </p>
                    </div>
                    <Button variant="outline" onClick={resetFilters}>
                      {t("common.reset_filters")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Table View (md and up, only when viewMode is 'table') */}
                    {viewMode === 'table' && (
                      <div className="hidden md:block rounded-md border overflow-x-auto">
                        <div>
                          <Table className="w-full table-fixed xl:table-auto">
                            <TableHeader>
                              {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                  {headerGroup.headers.map((header) => (
                                    <TableHead
                                      key={header.id}
                                      className={`bg-muted/50 whitespace-normal lg:whitespace-nowrap ${header.column.id === 'image' ? 'w-[128px] min-w-[128px] max-w-[128px]' : ''}`}
                                    >
                                      {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              ))}
                            </TableHeader>
                            <TableBody>
                              {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                  <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                  >
                                    {row.getVisibleCells().map((cell) => (
                                      <TableCell
                                        key={cell.id}
                                        className={`align-top whitespace-normal lg:whitespace-nowrap break-words p-2 ${cell.column.id === 'image' ? 'w-[128px] min-w-[128px] max-w-[128px] px-1 overflow-visible' : 'overflow-hidden'}`}
                                      >
                                        {flexRender(
                                          cell.column.columnDef.cell,
                                          cell.getContext()
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                  >
                                    No results.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Desktop Grid View (md and up, only when viewMode is 'grid') */}
                    {viewMode === 'grid' && (
                      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
                        {displayedItems.length > 0 ? (
                          displayedItems.map((item, idx) => (
                            <AuctionVehicleCard
                              key={`${item.id}-${item.vehicle_id}`}
                              item={item as any}
                              priority={idx < 4}
                              isSelected={selectedVehicleIds.includes(item.vehicle_id ?? item.id)}
                              showCompareCheckbox={showCompareCheckboxes}
                              isWatched={isWatched(item.vehicle_id ?? item.id)}
                              forceLayout="desktop"
                              onToggleSelect={(checked: boolean) => {
                                const id = item.vehicle_id ?? item.id;
                                const isMobile = window.innerWidth < 640;
                                const maxCompare = isMobile ? 2 : 5;
                                setSelectedVehicleIds((prev) =>
                                  checked
                                    ? prev.length < maxCompare
                                      ? [...prev, id]
                                      : prev
                                    : prev.filter((pid) => pid !== id)
                                );
                              }}
                              onToggleWatch={() => {
                                const id = item.vehicle_id ?? item.id;
                                if (!isAuthenticated) {
                                  setIsAuthDialogOpen(true);
                                  return;
                                }
                                toggleWatch(id);
                              }}
                              onCalculate={() => {
                                const id = item.vehicle_id ?? item.id;
                                setIsCalcModalOpen(true);
                                calculateQuotes(id);
                              }}
                              onViewDetails={() => {
                                const id = item.vehicle_id ?? item.id;
                                navigate({ pathname: `/vehicle/${id}` });
                              }}
                            />
                          ))
                        ) : null}
                      </div>
                    )}

                    {/* Mobile List View (<768px) - Copart-style cards */}
                    <div className="md:hidden auction-cards-grid">
                      {displayedItems.length > 0 ? (
                        displayedItems.map((item, idx) => (
                          <AuctionVehicleCard
                            key={`${item.id}-${item.vehicle_id}`}
                            item={item as any}
                            priority={idx < 4}
                            isSelected={selectedVehicleIds.includes(item.vehicle_id ?? item.id)}
                            showCompareCheckbox={showCompareCheckboxes}
                            isWatched={isWatched(item.vehicle_id ?? item.id)}
                            onToggleSelect={(checked: boolean) => {
                              const id = item.vehicle_id ?? item.id;
                              const isMobile = window.innerWidth < 640;
                              const maxCompare = isMobile ? 2 : 5;
                              setSelectedVehicleIds((prev) =>
                                checked
                                  ? prev.length < maxCompare
                                    ? [...prev, id]
                                    : prev
                                  : prev.filter((pid) => pid !== id)
                              );
                            }}
                            onToggleWatch={() => {
                              const id = item.vehicle_id ?? item.id;
                              if (!isAuthenticated) {
                                setIsAuthDialogOpen(true);
                                return;
                              }
                              toggleWatch(id);
                            }}
                            onCalculate={() => {
                              const id = item.vehicle_id ?? item.id;
                              setIsCalcModalOpen(true);
                              calculateQuotes(id);
                            }}
                            onViewDetails={() => {
                              const id = item.vehicle_id ?? item.id;
                              navigate({ pathname: `/vehicle/${id}` });
                            }}
                          />
                        ))
                      ) : null}
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col items-center gap-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {t("common.page")} {appliedPage} /{" "}
                        {backendData!.totalPages ?? Math.ceil(backendData!.total / limit)}
                      </span>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={appliedPage <= 1}
                          onClick={() => {
                            const prev = appliedPage - 1;
                            setPage(prev);
                            setAppliedPage(prev);
                            setExtraLoaded(null);
                            if (appliedFilters) {
                              const nextFilters = {
                                ...appliedFilters,
                                page: prev,
                              };
                              setAppliedFilters(nextFilters);
                            }

                            updateUrlFromState({ page: prev, replace: false });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {t("common.prev")}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            !canLoadMore &&
                            appliedPage >= (backendData!.totalPages ?? 1)
                          }
                          onClick={() => {
                            const next = appliedPage + 1;
                            setPage(next);
                            setAppliedPage(next);
                            setExtraLoaded(null);

                            if (appliedFilters) {
                              const nextFilters = {
                                ...appliedFilters,
                                page: next,
                              };
                              setAppliedFilters(nextFilters);
                            }

                            updateUrlFromState({ page: next, replace: false });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {t("common.next")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {false && (
        <>
          {/* Mobile Floating Compare Button (temporarily hidden) */}
          <AnimatePresence>
            {showCompareCheckboxes && selectedVehicleIds.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-16 right-4 z-50"
              >
                <Button
                  size="lg"
                  className="rounded-full shadow-xl bg-orange-600 hover:bg-orange-700 text-white px-6"
                  onClick={() => {
                    setIsCompareOpen(true);
                    setIsCompareLoading(true);
                    setCompareError(null);
                    setCompareResult(null);
                    compareVehicles({ vehicle_ids: selectedVehicleIds })
                      .then(setCompareResult)
                      .catch((err: Error) => setCompareError(err.message))
                      .finally(() => setIsCompareLoading(false));
                  }}
                >
                  <Icon icon="mdi:compare" className="w-5 h-5 mr-2" />
                  {t("common.compare")} ({selectedVehicleIds.length})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <ComparisonModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            isLoading={isCompareLoading}
            error={compareError}
            data={compareResult}
            backendItems={backendData?.items || []}
          />
        </>
      )}

      {/* Auth required for Watchlist */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold">
                  {t("auction.watch_auth_title")}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  {t("auction.watch_auth_description")}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label={t("common.close")}
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsAuthDialogOpen(false);
                navigate("/login");
              }}
            >
              {t("auth.login.title")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setIsAuthDialogOpen(false);
                navigate("/register");
              }}
            >
              {t("auth.register.title")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <AnimatePresence>
        {backendGallery && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
              <div className="flex flex-col">
                <h3 className="font-semibold">{backendGallery.title}</h3>
                {backendGallery.saleState && (
                  <span className="text-xs text-gray-400">
                    {backendGallery.saleState}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBackendGallery(null)}
                className="text-white hover:bg-white/20"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <img
                src={
                  backendGallery.photos[backendGalleryIndex] || "/cars/1.webp"
                }
                alt={backendGallery.title}
                className="max-w-full max-h-full object-contain"
              />

              {backendGallery.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBackendGalleryIndex((prev) =>
                        prev > 0 ? prev - 1 : backendGallery.photos.length - 1
                      );
                    }}
                  >
                    <Icon icon="mdi:chevron-left" className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBackendGalleryIndex((prev) =>
                        prev < backendGallery.photos.length - 1 ? prev + 1 : 0
                      );
                    }}
                  >
                    <Icon icon="mdi:chevron-right" className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>

            <div className="h-20 bg-black/80 flex items-center gap-2 px-4 overflow-x-auto">
              {backendGallery.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setBackendGalleryIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all ${idx === backendGalleryIndex
                    ? "ring-2 ring-white opacity-100"
                    : "opacity-50 hover:opacity-80"
                    }`}
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quotes Showcase Modal */}
      <AnimatePresence>
        {isCalcModalOpen && (
          <QuotesShowcase
            data={calcData}
            isLoading={isCalcLoading}
            error={calcError}
            onClose={() => setIsCalcModalOpen(false)}
            onSelectCompany={(companyName) => {
              console.log('Selected company:', companyName);
              // TODO: Navigate to company profile or initiate contact
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuctionListingsPage;
