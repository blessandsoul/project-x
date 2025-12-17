import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AuctionSidebarFilters, type CategoryFilter } from './AuctionSidebarFilters';

interface AuctionFiltersDrawerProps {
  showLabel?: boolean;
  categoryFilter?: CategoryFilter;
  onCategoryChange?: (category: CategoryFilter) => void;
  yearRange?: [number, number];
  onYearRangeChange?: (yearFrom: number, yearTo: number) => void;
  selectedMakeId?: number;
  onMakeChange?: (makeId: number | undefined, makeName: string | undefined) => void;
  selectedModelId?: number;
  onModelChange?: (modelId: number | undefined, modelName: string | undefined) => void;
  odometerRange?: [number, number];
  onOdometerRangeChange?: (odometerFrom: number, odometerTo: number) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (priceFrom: number, priceTo: number) => void;
  titleType?: string;
  onTitleTypeChange?: (titleType: string | undefined) => void;
  transmission?: string;
  onTransmissionChange?: (transmission: string | undefined) => void;
  fuel?: string;
  onFuelChange?: (fuel: string | undefined) => void;
  drive?: string;
  onDriveChange?: (drive: string | undefined) => void;
  cylinders?: string;
  onCylindersChange?: (cylinders: string | undefined) => void;
  location?: string;
  onLocationChange?: (location: string | undefined) => void;
  source?: string;
  onSourceChange?: (source: string | undefined) => void;
  buyNow?: boolean;
  onBuyNowChange?: (buyNow: boolean) => void;
  date?: string;
  onDateChange?: (date: string | undefined) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
}

/**
 * AuctionFiltersDrawer - Mobile drawer for auction filters
 * 
 * Passes through filter props to AuctionSidebarFilters.
 */
export function AuctionFiltersDrawer({
  showLabel = true,
  categoryFilter,
  onCategoryChange,
  yearRange,
  onYearRangeChange,
  selectedMakeId,
  onMakeChange,
  selectedModelId,
  onModelChange,
  odometerRange,
  onOdometerRangeChange,
  priceRange,
  onPriceRangeChange,
  titleType,
  onTitleTypeChange,
  transmission,
  onTransmissionChange,
  fuel,
  onFuelChange,
  drive,
  onDriveChange,
  cylinders,
  onCylindersChange,
  location,
  onLocationChange,
  source,
  onSourceChange,
  buyNow,
  onBuyNowChange,
  date,
  onDateChange,
  onApplyFilters,
  onResetFilters,
}: AuctionFiltersDrawerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <div className={showLabel ? "flex items-center justify-between mb-3" : "flex items-center justify-center"}>
        {showLabel && (
          <span className="text-sm font-semibold text-muted-foreground">
            {t('auction.filters.title')}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className={`${
            showLabel
              ? 'h-9 px-3 flex items-center gap-2'
              : 'h-10 sm:h-11 px-2.5 sm:px-4 flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-primary border-transparent shadow-sm'
          }`}
          onClick={() => setIsOpen(true)}
        >
          <Icon icon="mdi:filter-variant" className="w-4 h-4" />
          <span className={`text-xs font-medium ${!showLabel ? 'hidden sm:inline' : ''}`}>
            {t('common.filters')}
          </span>
        </Button>
      </div>

      {/* Drawer Sheet - uses the same Sheet component as the header burger menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className={cn(
            "bg-white h-full w-[320px] sm:w-[400px] border-r-2 border-primary/20 shadow-2xl p-0 overflow-hidden flex flex-col",
            "data-[state=closed]:pointer-events-none"
          )}
        >
          {/* Accent border */}
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-primary via-sub to-accent" />
          <div className="h-full overflow-y-auto">
            <AuctionSidebarFilters
              categoryFilter={categoryFilter}
              onCategoryChange={onCategoryChange}
              yearRange={yearRange}
              onYearRangeChange={onYearRangeChange}
              selectedMakeId={selectedMakeId}
              onMakeChange={onMakeChange}
              selectedModelId={selectedModelId}
              onModelChange={onModelChange}
              odometerRange={odometerRange}
              onOdometerRangeChange={onOdometerRangeChange}
              priceRange={priceRange}
              onPriceRangeChange={onPriceRangeChange}
              titleType={titleType}
              onTitleTypeChange={onTitleTypeChange}
              transmission={transmission}
              onTransmissionChange={onTransmissionChange}
              fuel={fuel}
              onFuelChange={onFuelChange}
              drive={drive}
              onDriveChange={onDriveChange}
              cylinders={cylinders}
              onCylindersChange={onCylindersChange}
              location={location}
              onLocationChange={onLocationChange}
              source={source}
              onSourceChange={onSourceChange}
              buyNow={buyNow}
              onBuyNowChange={onBuyNowChange}
              date={date}
              onDateChange={onDateChange}
              onApplyFilters={onApplyFilters}
              onResetFilters={onResetFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
