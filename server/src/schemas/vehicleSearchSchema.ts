import { z } from 'zod';

// ---------------------------------------------------------------------------
// Allowed values for multi-value filters
// ---------------------------------------------------------------------------

export const ALLOWED_TITLE_TYPES = ['clean title', 'nonrepairable', 'salvage title'] as const;
export const ALLOWED_TRANSMISSIONS = ['auto', 'manual'] as const;
export const ALLOWED_FUELS = ['petrol', 'diesel', 'electric', 'flexible', 'hybrid'] as const;
export const ALLOWED_DRIVES = ['front', 'rear', 'full'] as const;
export const ALLOWED_CYLINDERS = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', 'U'] as const;
export const ALLOWED_SOURCES = ['copart', 'iaai'] as const;

// ---------------------------------------------------------------------------
// Helper: Parse comma-separated string into array
// ---------------------------------------------------------------------------

const commaSeparatedString = z.string().transform((val) => {
  if (!val || val.trim() === '') return [];
  return val.split(',').map((s) => s.trim()).filter(Boolean);
});

// ---------------------------------------------------------------------------
// Helper: Validate each element in array against allowed values
// ---------------------------------------------------------------------------

function commaSeparatedEnum<T extends readonly string[]>(allowed: T, maxLength = 100) {
  return z
    .string()
    .max(maxLength, { message: `Value must be at most ${maxLength} characters` })
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    })
    .refine(
      (arr) => {
        if (!arr) return true;
        const allowedLower = allowed.map((v) => v.toLowerCase());
        return arr.every((v) => allowedLower.includes(v));
      },
      { message: `Invalid values. Allowed: ${allowed.join(', ')}` },
    );
}

// ---------------------------------------------------------------------------
// Helper: Parse date/datetime string
// Accepts: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
// ---------------------------------------------------------------------------

const dateOrDatetime = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      // Match YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      return dateRegex.test(val) || datetimeRegex.test(val);
    },
    { message: 'Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss' },
  );

// ---------------------------------------------------------------------------
// Helper: Strict date validation (YYYY-MM-DD only, must be a real date)
// ---------------------------------------------------------------------------

const strictDateOnly = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      // Must match YYYY-MM-DD format
      return /^\d{4}-\d{2}-\d{2}$/.test(val);
    },
    { message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2025-11-13)' },
  )
  .refine(
    (val) => {
      if (!val) return true;
      // Parse and validate it's a real date (not 2025-02-31, etc.)
      const parts = val.split('-').map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 0;
      const day = parts[2] ?? 0;
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    },
    { message: 'Invalid date. The date does not exist (e.g., 2025-02-31 is not valid)' },
  );

// ---------------------------------------------------------------------------
// Vehicle Search Query Schema
// ---------------------------------------------------------------------------

export const vehicleSearchQuerySchema = z.object({
  // Make filter: string, max 255 chars, trimmed
  make: z
    .string()
    .max(255, { message: 'Make must be at most 255 characters' })
    .transform((val) => val?.trim() || undefined)
    .optional(),
  // Model filter: string, max 255 chars, trimmed
  model: z
    .string()
    .max(255, { message: 'Model must be at most 255 characters' })
    .transform((val) => val?.trim() || undefined)
    .optional(),
  search: z.string().optional(),

  // Source filter (comma-separated, max 50 chars)
  // Allowed: 'copart', 'iaai' or any combination
  source: commaSeparatedEnum(ALLOWED_SOURCES, 50),

  // Category filter: strict validation for v, c, v,c, or c,v only
  category: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const allowed = ['v', 'c', 'v,c', 'c,v'];
        return allowed.includes(val);
      },
      { message: 'Invalid category. Allowed values: v, c, v,c, c,v' },
    )
    .transform((val) => {
      if (!val) return undefined;
      if (val === 'v') return ['v'] as ('v' | 'c')[];
      if (val === 'c') return ['c'] as ('v' | 'c')[];
      // v,c or c,v both mean both categories
      return ['v', 'c'] as ('v' | 'c')[];
    }),

  // Buy now filter - strictly accepts only 'true' or 'false'
  buy_now: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const lower = val.toLowerCase();
        return lower === 'true' || lower === 'false';
      },
      { message: "Invalid buy_now value. Allowed values: 'true', 'false'" },
    )
    .transform((val) => {
      if (!val) return undefined;
      return val.toLowerCase() === 'true';
    }),

  // Year filter - must be exactly 4 digits (1900-2099)
  year: z.coerce
    .number()
    .int()
    .min(1900, { message: 'Year must be at least 1900' })
    .max(2099, { message: 'Year must be at most 2099' })
    .refine((val) => val >= 1000 && val <= 9999, {
      message: 'Year must be exactly 4 digits',
    })
    .optional(),
  year_from: z.coerce
    .number()
    .int()
    .min(1900, { message: 'Year must be at least 1900' })
    .max(2099, { message: 'Year must be at most 2099' })
    .refine((val) => val >= 1000 && val <= 9999, {
      message: 'Year must be exactly 4 digits',
    })
    .optional(),
  year_to: z.coerce
    .number()
    .int()
    .min(1900, { message: 'Year must be at least 1900' })
    .max(2099, { message: 'Year must be at most 2099' })
    .refine((val) => val >= 1000 && val <= 9999, {
      message: 'Year must be exactly 4 digits',
    })
    .optional(),

  // Price filter - price_from: 0+, price_to: 0-500000
  // When price_to is 500000, it means "500000 and more" (no upper bound applied)
  price_from: z.coerce
    .number()
    .min(0, { message: 'Price must be at least 0' })
    .max(500000, { message: 'Price must be at most 500,000' })
    .optional(),
  price_to: z.coerce
    .number()
    .min(0, { message: 'Price must be at least 0' })
    .max(500000, { message: 'Price must be at most 500,000' })
    .optional(),

  // Odometer filter (maps to DB column: mileage)
  // Both accept 0-250000. When 250000 is selected, it means "250000 and more"
  odometer_from: z.coerce
    .number()
    .int({ message: 'Odometer must be a whole number' })
    .min(0, { message: 'Odometer must be at least 0' })
    .max(250000, { message: 'Odometer must be at most 250,000' })
    .optional(),
  odometer_to: z.coerce
    .number()
    .int({ message: 'Odometer must be a whole number' })
    .min(0, { message: 'Odometer must be at least 0' })
    .max(250000, { message: 'Odometer must be at most 250,000' })
    .optional(),

  // Legacy mileage params (for backward compatibility) - same validation
  mileage_from: z.coerce
    .number()
    .int({ message: 'Mileage must be a whole number' })
    .min(0, { message: 'Mileage must be at least 0' })
    .max(250000, { message: 'Mileage must be at most 250,000' })
    .optional(),
  mileage_to: z.coerce
    .number()
    .int({ message: 'Mileage must be a whole number' })
    .min(0, { message: 'Mileage must be at least 0' })
    .max(250000, { message: 'Mileage must be at most 250,000' })
    .optional(),

  // Title type filter (comma-separated, maps to DB column: sale_title_type)
  title_type: commaSeparatedEnum(ALLOWED_TITLE_TYPES),

  // Transmission filter (comma-separated, max 50 chars)
  // Allowed: 'auto', 'manual', or 'auto,manual'
  transmission: commaSeparatedEnum(ALLOWED_TRANSMISSIONS, 50),

  // Fuel filter (comma-separated, max 100 chars, maps to DB column: engine_fuel)
  // Allowed: 'petrol', 'diesel', 'electric', 'flexible', 'hybrid' or any combination
  fuel: commaSeparatedEnum(ALLOWED_FUELS, 100),

  // Legacy fuel_type param (for backward compatibility)
  fuel_type: z.string().optional(),

  // Drive filter (comma-separated, max 100 chars)
  // Allowed: 'front', 'rear', 'full' or any combination
  // Note: 'full' matches DB values 'full', 'full/front', 'full/rear'
  drive: commaSeparatedEnum(ALLOWED_DRIVES, 100),

  // Location filter (city name, max 100 chars)
  location: z.string().max(100).optional(),

  // Fuzzy location matching - when true, uses fuzzy matching instead of exact match
  // Also automatically enabled when exact match returns 0 results
  fuzzy_location: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.toLowerCase() === 'true' || val === '1';
    }),

  // Cylinders filter (comma-separated, max 50 chars)
  // Allowed: 0,1,2,3,4,5,6,8,10,12,U (any combination, case-insensitive)
  cylinders: commaSeparatedEnum(ALLOWED_CYLINDERS, 50),

  // Sale date filter (maps to DB columns: sold_at_date, sold_at_time)
  sold_from: dateOrDatetime,
  sold_to: dateOrDatetime,

  // Exact date filter (strict YYYY-MM-DD format, filters sold_at_date = date)
  date: strictDateOnly,

  // Pagination
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(250).optional().default(20),

  // Sorting
  sort: z
    .enum([
      'price_asc',
      'price_desc',
      'year_desc',
      'year_asc',
      'mileage_asc',
      'mileage_desc',
      'sold_date_desc',
      'sold_date_asc',
      'best_value',
    ])
    .optional(),
});

export type VehicleSearchQuery = z.infer<typeof vehicleSearchQuerySchema>;

// ---------------------------------------------------------------------------
// Parsed filters type for model layer
// ---------------------------------------------------------------------------

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  fuelType?: string;
  fuelTypes?: string[];
  categoryCodes?: ('v' | 'c')[];
  drive?: string;
  driveTypes?: string[];
  source?: string;
  sourceTypes?: string[];
  buyNow?: boolean;
  vin?: string;
  sourceLotId?: string;
  titleTypes?: string[];
  transmissionTypes?: string[];
  cylinderTypes?: string[];
  soldFrom?: string;
  soldTo?: string;
  location?: string;
  fuzzyLocation?: boolean;
  date?: string;
}
