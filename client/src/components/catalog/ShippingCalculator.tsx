import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet, apiPost } from '@/lib/apiClient';

// Types - API returns arrays of strings
interface CitiesResponse {
  success: boolean;
  count: number;
  data: string[];
}

interface PortsResponse {
  success: boolean;
  count: number;
  data: string[];
}

interface CalculatorRequest {
  usacity: string;
  destinationport: string;
  buyprice: number;
  vehicletype: 'standard' | 'heavy';
  vehiclecategory:
    | 'Sedan'
    | 'Bike'
    | 'Small SUV'
    | 'Big SUV'
    | 'Pickup'
    | 'Van'
    | 'Big Van';
  auction: string;
}

export interface CalculatorResult {
  success?: boolean;
  data?: {
    transportation_total?: number;
    currency?: string;
  };
  // Legacy fields for backwards compatibility
  total_price?: number;
  shipping_cost?: number;
  transportation_total?: number;
  [key: string]: unknown;
}

const VEHICLE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'heavy', label: 'Heavy' },
] as const;

const VEHICLE_CATEGORIES = [
  { value: 'Sedan', label: 'Sedan' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Small SUV', label: 'Small SUV' },
  { value: 'Big SUV', label: 'Big SUV' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Van', label: 'Van' },
  { value: 'Big Van', label: 'Big Van' },
] as const;

type VehicleType = (typeof VEHICLE_TYPES)[number]['value'];
type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number]['value'];

export interface CalculatorFormValues {
  city: string;
  destinationPort: string;
  vehicleType: VehicleType;
  vehicleCategory: VehicleCategory;
}

export interface ShippingCalculatorProps {
  className?: string;
  /** Initial values for the form (e.g., from URL params) */
  initialValues?: Partial<CalculatorFormValues>;
  /** If true and initialValues are complete, auto-submit on mount */
  autoSubmit?: boolean;
  /** Called when calculation completes successfully */
  onCalculationComplete?: (result: CalculatorResult, formValues: CalculatorFormValues) => void;
  /** Called when calculation starts */
  onCalculationStart?: () => void;
  /** Called when calculation fails or is cleared */
  onCalculationClear?: () => void;
}

const isValidVehicleType = (v: string): v is VehicleType =>
  VEHICLE_TYPES.some((t) => t.value === v);

const isValidVehicleCategory = (v: string): v is VehicleCategory =>
  VEHICLE_CATEGORIES.some((c) => c.value === v);

export const ShippingCalculator = ({
  className,
  initialValues,
  autoSubmit = false,
  onCalculationComplete,
  onCalculationStart,
  onCalculationClear,
}: ShippingCalculatorProps) => {
  const { t } = useTranslation();

  // Data loading states
  const [cities, setCities] = useState<string[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isLoadingPorts, setIsLoadingPorts] = useState(true);

  // Form state - initialize from props if provided
  const [city, setCity] = useState<string>(initialValues?.city ?? '');
  const [destinationPort, setDestinationPort] = useState<string>(initialValues?.destinationPort ?? '');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    initialValues?.vehicleType && isValidVehicleType(initialValues.vehicleType)
      ? initialValues.vehicleType
      : 'standard'
  );
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>(
    initialValues?.vehicleCategory && isValidVehicleCategory(initialValues.vehicleCategory)
      ? initialValues.vehicleCategory
      : 'Sedan'
  );

  // Sync form state when initialValues prop changes (for URL restore)
  useEffect(() => {
    if (initialValues?.city) setCity(initialValues.city);
    if (initialValues?.destinationPort) setDestinationPort(initialValues.destinationPort);
    if (initialValues?.vehicleType && isValidVehicleType(initialValues.vehicleType)) {
      setVehicleType(initialValues.vehicleType);
    }
    if (initialValues?.vehicleCategory && isValidVehicleCategory(initialValues.vehicleCategory)) {
      setVehicleCategory(initialValues.vehicleCategory);
    }
  }, [initialValues]);

  // Track if auto-submit has been triggered
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Submission state
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // Load cities on mount
  useEffect(() => {
    let isCancelled = false;

    const loadCities = async () => {
      try {
        setIsLoadingCities(true);
        const response = await apiGet<CitiesResponse>('/api/cities');
        if (!isCancelled && response.success) {
          setCities(response.data);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingCities(false);
        }
      }
    };

    void loadCities();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Load ports on mount
  useEffect(() => {
    let isCancelled = false;

    const loadPorts = async () => {
      try {
        setIsLoadingPorts(true);
        const response = await apiGet<PortsResponse>('/api/ports');
        if (!isCancelled && response.success) {
          setPorts(response.data);
        }
      } catch (err) {
        console.error('Failed to load ports:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingPorts(false);
        }
      }
    };

    void loadPorts();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Validation
  const validateForm = (): string | null => {
    if (!city) {
      return t('calculator.errors.city_required', 'Please select a city');
    }
    if (city.length > 30) {
      return t('calculator.errors.city_too_long', 'City name is too long (max 30 characters)');
    }
    if (!destinationPort) {
      return t('calculator.errors.port_required', 'Please select a destination port');
    }
    if (destinationPort.length > 30) {
      return t('calculator.errors.port_too_long', 'Port name is too long (max 30 characters)');
    }
    if (!vehicleType || !['standard', 'heavy'].includes(vehicleType)) {
      return t('calculator.errors.vehicle_type_required', 'Please select a vehicle type');
    }
    const validCategories = ['Sedan', 'Bike', 'Small SUV', 'Big SUV', 'Pickup', 'Van', 'Big Van'];
    if (!vehicleCategory || !validCategories.includes(vehicleCategory)) {
      return t('calculator.errors.vehicle_category_required', 'Please select a vehicle category');
    }
    return null;
  };

  const handleCalculate = async () => {
    // Clear previous state
    setError(null);
    setResult(null);
    onCalculationClear?.();

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Build payload
    const payload: CalculatorRequest = {
      usacity: city.trim(),
      destinationport: destinationPort.trim(),
      buyprice: 1, // Always 1 as per requirements
      vehicletype: vehicleType,
      vehiclecategory: vehicleCategory,
      auction: 'Copart', // Default auction for calculator
    };

    try {
      setIsCalculating(true);
      onCalculationStart?.();
      const response = await apiPost<CalculatorResult>('/api/calculator', payload);
      setResult(response);
      onCalculationComplete?.(response, { city, destinationPort, vehicleType, vehicleCategory });
    } catch (err) {
      console.error('Calculator API error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('calculator.errors.calculation_failed', 'Calculation failed. Please try again.');
      setError(errorMessage);
      onCalculationClear?.();
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-submit when data is loaded and initialValues are complete
  useEffect(() => {
    if (
      autoSubmit &&
      !hasAutoSubmitted &&
      !isLoadingCities &&
      !isLoadingPorts &&
      city &&
      destinationPort &&
      vehicleType &&
      vehicleCategory
    ) {
      setHasAutoSubmitted(true);
      void handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, hasAutoSubmitted, isLoadingCities, isLoadingPorts, city, destinationPort, vehicleType, vehicleCategory]);

  const isFormValid = city && destinationPort && vehicleType && vehicleCategory;

  return (
    <div className={`rounded-md border border-slate-200 bg-white shadow-sm px-5 py-4 ${className ?? ''}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calculator-variant" className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-primary">
            {t('calculator.title', 'Shipping Calculator')}
          </h2>
        </div>
        <p className="hidden md:block text-xs text-muted-foreground">
          {t('calculator.helper_text', 'Price appears in the company list below.')}
        </p>
      </div>

      {/* Form - 2 columns on desktop */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* City Select */}
          <div>
            <Label htmlFor="calc-city" className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('calculator.city', 'City')} <span className="text-destructive">*</span>
            </Label>
            {isLoadingCities ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="calc-city" className="w-full h-9 text-sm">
                  <SelectValue placeholder={t('calculator.select_city', 'Select city...')} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {/* Include initial value if not in list (for URL restore) */}
                  {city && !cities.includes(city) && (
                    <SelectItem key={city} value={city} className="text-sm">
                      {city}
                    </SelectItem>
                  )}
                  {cities.map((cityName) => (
                    <SelectItem key={cityName} value={cityName} className="text-sm">
                      {cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Destination Port Select */}
          <div>
            <Label htmlFor="calc-port" className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('calculator.destination_port', 'Destination Port')} <span className="text-destructive">*</span>
            </Label>
            {isLoadingPorts ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={destinationPort} onValueChange={setDestinationPort}>
                <SelectTrigger id="calc-port" className="w-full h-9 text-sm">
                  <SelectValue placeholder={t('calculator.select_port', 'Select port...')} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {/* Include initial value if not in list (for URL restore) */}
                  {destinationPort && !ports.includes(destinationPort) && (
                    <SelectItem key={destinationPort} value={destinationPort} className="text-sm">
                      {t(`calculator.ports.${destinationPort}`, destinationPort)}
                    </SelectItem>
                  )}
                  {ports.map((portName) => (
                    <SelectItem key={portName} value={portName} className="text-sm">
                      {t(`calculator.ports.${portName}`, portName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Vehicle Type Select */}
          <div>
            <Label htmlFor="calc-vehicle-type" className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('calculator.vehicle_type', 'Vehicle Type')} <span className="text-destructive">*</span>
            </Label>
            <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
              <SelectTrigger id="calc-vehicle-type" className="w-full h-9 text-sm">
                <SelectValue placeholder={t('calculator.select_vehicle_type', 'Select type...')} />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm">
                    {t(`calculator.vehicle_types.${type.value}`, type.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Category Select */}
          <div>
            <Label htmlFor="calc-vehicle-category" className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('calculator.vehicle_category', 'Vehicle Category')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={vehicleCategory}
              onValueChange={(v) => setVehicleCategory(v as VehicleCategory)}
            >
              <SelectTrigger id="calc-vehicle-category" className="w-full h-9 text-sm">
                <SelectValue
                  placeholder={t('calculator.select_vehicle_category', 'Select category...')}
                />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm">
                    {t(`calculator.vehicle_categories.${cat.value}`, cat.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Button row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="md:hidden text-xs text-muted-foreground">
            {t('calculator.helper_text', 'Price appears in the company list below.')}
          </p>

          <Button
            onClick={handleCalculate}
            disabled={!isFormValid || isCalculating}
            className="w-full md:w-auto md:min-w-[180px] flex items-center justify-center gap-2 bg-[#101B3D] hover:bg-[#0c142f]"
          >
            {isCalculating ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                <span>{t('calculator.calculating', 'Calculating...')}</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:calculator" className="h-4 w-4" />
                <span>{t('calculator.calculate', 'Calculate')}</span>
              </>
            )}
          </Button>
        </div>

        {/* Error Alert - compact inline */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <Icon icon="mdi:alert-circle" className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success indicator - compact inline */}
        {result && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <Icon icon="mdi:check-circle" className="h-4 w-4 flex-shrink-0" />
            <span>{t('calculator.price_shown_in_list', 'Price is displayed in the company list below.')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingCalculator;
