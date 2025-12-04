import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header/index.tsx";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { navigationItems } from "@/config/navigation";
import {
  searchVehicles,
  compareVehicles,
} from "@/api/vehicles";
import type { VehiclesCompareResponse } from "@/api/vehicles";
import { fetchCatalogMakes, fetchCatalogModels } from "@/api/catalog";
import type {
  CatalogMake,
  CatalogModel,
  VehicleCatalogType,
} from "@/api/catalog";
import type {
  SearchVehiclesResponse,
  VehiclesSearchFilters,
  VehicleSortOption,
} from "@/types/vehicles";
import { useCalculateVehicleQuotes } from "@/hooks/useCalculateVehicleQuotes";
import { useVehicleWatchlist } from "@/hooks/useVehicleWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  AuctionFilters,
  type FilterState,
} from "@/components/auction/AuctionFilters";
import { AuctionSidebarFilters } from "@/components/auction/AuctionSidebarFilters";
import { AuctionVehicleCard } from "@/components/auction/AuctionVehicleCard";

import { ComparisonModal } from "@/components/auction/ComparisonModal";

type AuctionHouse = "all" | "Copart" | "IAAI";
type LotStatus = "all" | "run" | "enhanced" | "non-runner";
type DamageType = "all" | "front" | "rear" | "side";
type SortOption = "none" | VehicleSortOption;

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
    drive: input.drive === "all" ? undefined : input.drive,
    // auction/source mapping: Copart/IAAI -> copart/iaai
    source:
      input.auctionFilter && input.auctionFilter !== "all"
        ? input.auctionFilter.toLowerCase()
        : undefined,
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

const AuctionListingsPage = () => {
  const { t } = useTranslation();
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
  const [limit, setLimit] = useState(36);
  const [, setPage] = useState(1);
  const [buyNowOnly, setBuyNowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [selectedMakeId, setSelectedMakeId] = useState<string>("all");
  const [selectedModelId, setSelectedModelId] = useState<string>("all");
  const [catalogMakes, setCatalogMakes] = useState<CatalogMake[]>([]);
  const [catalogModels, setCatalogModels] = useState<CatalogModel[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
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
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResult, setCompareResult] =
    useState<VehiclesCompareResponse | null>(null);
  const [showCompareCheckboxes, setShowCompareCheckboxes] = useState(false);
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

  // Only initialize state from URL once on initial mount.
  const hasInitializedFromUrl = useRef(false);

  const vehicleCatalogType: VehicleCatalogType = useMemo(() => {
    if (searchKind === "moto") {
      return "motorcycle";
    }

    return "car";
  }, [searchKind]);

  const selectedMakeName = useMemo(() => {
    if (selectedMakeId === "all") {
      return undefined;
    }

    const matchedMake = catalogMakes.find(
      (make) => String(make.makeId) === selectedMakeId
    );
    return matchedMake?.name;
  }, [selectedMakeId, catalogMakes]);

  const selectedModelName = useMemo(() => {
    if (selectedModelId === "all") {
      return undefined;
    }

    const matchedModel = catalogModels.find(
      (model) => String(model.modelId) === selectedModelId
    );
    return matchedModel?.name;
  }, [selectedModelId, catalogModels]);

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
      selectedMakeName,
      selectedModelName,
      sort: sortBy,
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

    if (appliedFilters.fuel_type) {
      let fuelLabel: string;
      switch (appliedFilters.fuel_type) {
        case "petrol":
          fuelLabel = t("common.fuel_gas");
          break;
        case "diesel":
          fuelLabel = t("common.fuel_diesel");
          break;
        case "hybrid":
          fuelLabel = t("common.fuel_hybrid");
          break;
        case "electric":
          fuelLabel = t("common.fuel_electric");
          break;
        case "flexible":
          fuelLabel = t("common.fuel_flexible");
          break;
        default:
          fuelLabel = appliedFilters.fuel_type;
          break;
      }

      labels.push({
        id: "fuel",
        label: `${t("auction.filters.fuel")}: ${fuelLabel}`,
      });
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
      } else if (appliedFilters.category === "a") {
        categoryLabel = t("common.vans");
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
        labels.push({
          id: "price",
          label: `${t("auction.filters.price")}: $${from || "?"}-$${to || "?"}`,
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
        labels.push({
          id: "mileage",
          label: `${t("auction.filters.mileage")}: ${
            from.toLocaleString() || "?"
          }-${to.toLocaleString() || "?"}`,
        });
      }
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
      categoryParam && ["all", "v", "c", "a"].includes(categoryParam)
        ? categoryParam
        : "all";

    const driveParam = params.get("drive");
    const nextDrive =
      driveParam && ["all", "front", "rear", "full"].includes(driveParam)
        ? driveParam
        : "all";

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
      selectedMakeName: urlMake ?? selectedMakeName,
      selectedModelName: urlModel ?? selectedModelName,
      sort: nextSortBy,
    });

    // Set all state values
    setSearchQuery(nextSearchQuery);
    setSearchKind(nextSearchKind);
    setAuctionFilter(nextAuctionFilter);
    setFuelType(nextFuelType);
    setCategory(nextCategory);
    setDrive(nextDrive);
    setYearRange(nextYearRange);
    setExactYear(nextExactYear);
    setMileageRange(nextMileageRange);
    setPriceRange(nextPriceRange);
    setSortBy(nextSortBy);
    setBuyNowOnly(nextBuyNowOnly);
    setLimit(nextLimit);
    setPage(nextPage);
    setAppliedFilters(filters);
    setAppliedPage(filters.page);
    setExtraLoaded(null);
  }, [location.search, selectedMakeName, selectedModelName]);

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

  const randomCalcQuote = useMemo(() => {
    if (!calcData || !calcData.quotes || calcData.quotes.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * calcData.quotes.length);
    return calcData.quotes[index];
  }, [calcData]);

  type BackendData = NonNullable<typeof backendData>;
  type BackendItem = BackendData["items"][number];

  const displayedItems: BackendItem[] = useMemo(
    () => (extraLoaded ? extraLoaded.items : backendData?.items ?? []),
    [extraLoaded, backendData?.items]
  );

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

  const handleLoadMore = async () => {
    if (!appliedFilters || !backendData) return;

    const baseLimit = appliedFilters.limit;
    const currentPage = appliedPage;
    const nextPage = extraLoaded ? extraLoaded.endPage + 1 : currentPage + 1;

    const maxPage =
      backendData.totalPages ??
      Math.max(1, Math.ceil(backendData.total / baseLimit));
    if (nextPage > maxPage) return;

    try {
      const result = await searchVehicles({
        ...appliedFilters,
        page: nextPage,
      });
      const nextItems = (result.items ?? []) as BackendItem[];

      if (!extraLoaded) {
        const combined = [...(backendData?.items ?? []), ...nextItems];
        setExtraLoaded({
          startPage: currentPage,
          endPage: nextPage,
          items: combined,
        });
      } else {
        const combined = [...extraLoaded.items, ...nextItems];
        setExtraLoaded({
          startPage: extraLoaded.startPage,
          endPage: nextPage,
          items: combined,
        });
      }
    } catch (error) {
      console.error(
        "[AuctionListingsPage] Failed to load more vehicles",
        error
      );
    }
  };

  // Bridge function to update state from AuctionFilters
  const handleFilterChange = (updates: Partial<FilterState>) => {
    if (updates.searchQuery !== undefined) setSearchQuery(updates.searchQuery);
    if (updates.searchKind !== undefined) setSearchKind(updates.searchKind);
    if (updates.auctionFilter !== undefined)
      setAuctionFilter(updates.auctionFilter);
    if (updates.fuelType !== undefined) setFuelType(updates.fuelType);
    if (updates.category !== undefined) setCategory(updates.category);
    if (updates.drive !== undefined) setDrive(updates.drive);
    if (updates.yearRange !== undefined) setYearRange(updates.yearRange);
    if (updates.priceRange !== undefined) setPriceRange(updates.priceRange);
    if (updates.mileageRange !== undefined)
      setMileageRange(updates.mileageRange);
    if (updates.exactYear !== undefined) setExactYear(updates.exactYear);
    if (updates.selectedMakeId !== undefined)
      setSelectedMakeId(updates.selectedMakeId);
    if (updates.selectedModelId !== undefined)
      setSelectedModelId(updates.selectedModelId);
    if (updates.buyNowOnly !== undefined) setBuyNowOnly(updates.buyNowOnly);
    if (updates.limit !== undefined) setLimit(updates.limit);
  };

  const applyFilters = () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      // Validation handled by input constraints or toast in future
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
      selectedMakeName,
      selectedModelName,
      sort: sortBy,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    // Update URL directly from computed filters
    updateUrlFromFilters(nextFilters, { replace: false });
  };

  // Reset only the draft filter controls inside the drawer, without
  // touching appliedFilters/backend data or URL. User must still click
  // "Show results" to apply the cleared state.
  const resetDrawerFilters = () => {
    const defaultYearRange: [number, number] = [0, 0];
    const defaultPriceRange: [number, number] = [0, 0];
    const defaultMileageRange: [number, number] = [0, 0];

    setAuctionFilter("all");
    setSearchKind("all");
    setFuelType("all");
    setCategory("all");
    setDrive("all");
    setYearRange(defaultYearRange);
    setExactYear("");
    setMileageRange(defaultMileageRange);
    setPriceRange(defaultPriceRange);
    setSelectedMakeId("all");
    setSelectedModelId("all");
    setCatalogModels([]);
    setBuyNowOnly(false);
    setLimit(36);
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
    setLimit(36);
    setPage(1);
    setBuyNowOnly(false);
    setSearchQuery("");
    setSortBy("none");
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
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setAppliedFilters(nextFilters);
    setAppliedPage(1);
    setExtraLoaded(null);

    // Update URL directly from computed filters (not from state which hasn't updated yet)
    updateUrlFromFilters(nextFilters, { replace: false });
  };

  const handleRemoveFilter = (id: string) => {
    // Mutate local state first
    switch (id) {
      case "search":
        setSearchQuery("");
        break;
      case "auction":
        setAuctionFilter("all");
        break;
      case "fuel":
        setFuelType("all");
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
        setCatalogModels([]);
        break;
      case "model":
        setSelectedModelId("all");
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
      default:
        break;
    }

    // Recompute filters from the *next* logical state, not URL
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
      selectedMakeName: id === "make" ? undefined : selectedMakeName,
      selectedModelName:
        id === "make" || id === "model" ? undefined : selectedModelName,
      sort: sortBy,
    };

    const nextFilters = buildFiltersFromDraftState(draft);
    setPage(1);
    setAppliedPage(1);
    setAppliedFilters(nextFilters);
    setExtraLoaded(null);

    // Update URL directly from computed filters (not from state which hasn't updated yet)
    updateUrlFromFilters(nextFilters, { replace: false });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pt-16">
      <Header user={null} navigationItems={navigationItems} />
      <main
        className="flex-1 flex flex-col"
        role="main"
        aria-label={t("auction.active_auctions")}
      >
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {t("auction.active_auctions")}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                {t("auction.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 z-30">
              <AuctionSidebarFilters
                filters={{
                  searchQuery,
                  searchKind,
                  auctionFilter,
                  fuelType,
                  category,
                  drive,
                  yearRange,
                  priceRange,
                  mileageRange,
                  exactYear,
                  selectedMakeId,
                  selectedModelId,
                  buyNowOnly,
                  limit,
                }}
                setFilters={handleFilterChange}
                catalogMakes={catalogMakes}
                catalogModels={catalogModels}
                isLoadingMakes={isLoadingMakes}
                isLoadingModels={isLoadingModels}
                onApply={applyFilters}
                onReset={resetDrawerFilters}
              />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-4 space-y-6">
              {/* Desktop Search Bar */}
              <div className="hidden lg:flex gap-3">
                <div className="relative flex-1">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  />
                  <Input
                    placeholder={t("auction.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters();
                    }}
                    className="pl-11 h-11 text-base bg-white border-slate-200 shadow-sm rounded-lg"
                  />
                </div>
                <Button onClick={applyFilters} className="h-11 px-6">
                  {t("common.search")}
                </Button>
              </div>

              {/* Desktop Active Filter Chips */}
              <AnimatePresence>
                {activeFilterLabels.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="hidden lg:flex flex-wrap gap-2"
                  >
                    {activeFilterLabels.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="px-2 py-1 h-7 gap-1 text-xs font-normal bg-secondary/50 hover:bg-secondary border-transparent transition-colors"
                      >
                        {tag.label}
                        <button
                          onClick={() => handleRemoveFilter(tag.id)}
                          className="ml-1 hover:text-destructive focus:outline-none"
                          aria-label="Remove filter"
                        >
                          <Icon icon="mdi:close" className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={resetFilters}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-0 ml-1"
                    >
                      {t("common.clear_all")}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Filters */}
              <div className="lg:hidden">
                <AuctionFilters
                  filters={{
                    searchQuery,
                    searchKind,
                    auctionFilter,
                    fuelType,
                    category,
                    drive,
                    yearRange,
                    priceRange,
                    mileageRange,
                    exactYear,
                    selectedMakeId,
                    selectedModelId,
                    buyNowOnly,
                    limit,
                  }}
                  setFilters={handleFilterChange}
                  catalogMakes={catalogMakes}
                  catalogModels={catalogModels}
                  isLoadingMakes={isLoadingMakes}
                  isLoadingModels={isLoadingModels}
                  onApply={applyFilters}
                  onReset={resetFilters}
                  activeFilterLabels={activeFilterLabels}
                  onRemoveFilter={handleRemoveFilter}
                />
              </div>

              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {t("auction.real_results")}
                    {backendData && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal bg-muted text-muted-foreground"
                      >
                        {backendData.total}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isBackendLoading && t("auction.loading_data")}
                    {!isBackendLoading &&
                      !backendError &&
                      backendData &&
                      t("auction.showing_results", {
                        count: displayedItems.length,
                        total: backendData.total,
                      })}
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
                        selectedMakeName,
                        selectedModelName,
                        sort: newSort,
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
                      <SelectItem value="price_asc">
                        {t("sort.price_low")}
                      </SelectItem>
                      <SelectItem value="price_desc">
                        {t("sort.price_high")}
                      </SelectItem>
                      <SelectItem value="year_asc">
                        {t("sort.year_old")}
                      </SelectItem>
                      <SelectItem value="year_desc">
                        {t("sort.year_new")}
                      </SelectItem>
                      <SelectItem value="mileage_asc">
                        {t("sort.mileage_low")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showCompareCheckboxes ? "secondary" : "outline"}
                    size="sm"
                    className={`h-9 gap-2 ${
                      showCompareCheckboxes
                        ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
                        : ""
                    }`}
                    onClick={() => {
                      if (!showCompareCheckboxes)
                        setShowCompareCheckboxes(true);
                      else if (selectedVehicleIds.length === 0)
                        setShowCompareCheckboxes(false);
                    }}
                  >
                    <Icon icon="mdi:compare" className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {t("auction.price_comparison")}
                    </span>
                    {selectedVehicleIds.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 px-1.5 bg-orange-500 text-white"
                      >
                        {selectedVehicleIds.length}
                      </Badge>
                    )}
                  </Button>

                  {showCompareCheckboxes && selectedVehicleIds.length > 0 && (
                    <Button
                      size="sm"
                      className="hidden sm:inline-flex h-9 bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        setIsCompareOpen(true);
                        setIsCompareLoading(true);
                        setCompareError(null);
                        setCompareResult(null);
                        compareVehicles({ vehicle_ids: selectedVehicleIds })
                          .then(setCompareResult)
                          .catch((err) => setCompareError(err.message))
                          .finally(() => setIsCompareLoading(false));
                      }}
                    >
                      {t("common.compare")}
                    </Button>
                  )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
                      {displayedItems.map((item, idx) => (
                        <AuctionVehicleCard
                          key={`${item.id}-${item.vehicle_id}`}
                          item={item}
                          priority={idx < 4}
                          isSelected={selectedVehicleIds.includes(
                            item.vehicle_id ?? item.id
                          )}
                          showCompareCheckbox={showCompareCheckboxes}
                          isWatched={isWatched(item.vehicle_id ?? item.id)}
                          onToggleSelect={(checked: boolean) => {
                            const id = item.vehicle_id ?? item.id;
                            const isMobile = window.innerWidth < 640;
                            const limit = isMobile ? 2 : 5;

                            setSelectedVehicleIds((prev) =>
                              checked
                                ? prev.length < limit
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
                      ))}
                    </div>

                    {/* Pagination & Load More */}
                    <div className="flex flex-col items-center gap-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {t("common.page")} {appliedPage} /{" "}
                        {backendData!.totalPages ??
                          Math.ceil(backendData!.total / limit)}
                      </span>

                      {canLoadMore && (
                        <Button
                          onClick={handleLoadMore}
                          className="w-full max-w-xs"
                          variant="secondary"
                        >
                          {t("auction.load_more")}
                        </Button>
                      )}

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

      {/* Mobile Floating Compare Button */}
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
                  .catch((err) => setCompareError(err.message))
                  .finally(() => setIsCompareLoading(false));
              }}
            >
              <Icon icon="mdi:compare" className="w-5 h-5 mr-2" />
              {t("common.compare")} ({selectedVehicleIds.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer footerLinks={Object.values(navigationItems).flat()} />

      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        isLoading={isCompareLoading}
        error={compareError}
        data={compareResult}
        backendItems={backendData?.items || []}
      />

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
                  className={`relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all ${
                    idx === backendGalleryIndex
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

      {/* Calculator Modal */}
      <AnimatePresence>
        {isCalcModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCalcModalOpen(false)}
          >
            <motion.div
              className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {t("auction.calculate_cost")}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCalcModalOpen(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                {isCalcLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Icon
                      icon="mdi:calculator"
                      className="w-8 h-8 animate-bounce text-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("common.loading")}
                    </p>
                  </div>
                ) : calcError ? (
                  <div className="text-center text-destructive py-4">
                    {t("error.generic")}
                  </div>
                ) : randomCalcQuote ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("auction.estimated_total")}
                      </p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {formatMoney(randomCalcQuote.total_price)}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">
                          {t("auction.shipping")}
                        </span>
                        <span>
                          {formatMoney(
                            randomCalcQuote.breakdown.shipping_total
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">
                          {t("auction.fees")}
                        </span>
                        <span>
                          {formatMoney(
                            randomCalcQuote.breakdown.service_fee +
                              randomCalcQuote.breakdown.broker_fee
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">
                          {t("auction.customs")}
                        </span>
                        <span>
                          {formatMoney(randomCalcQuote.breakdown.customs_fee)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuctionListingsPage;
