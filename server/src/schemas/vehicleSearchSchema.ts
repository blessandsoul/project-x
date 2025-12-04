import { z } from 'zod';

// ---------------------------------------------------------------------------
// Allowed values for multi-value filters
// ---------------------------------------------------------------------------

export const ALLOWED_TITLE_TYPES = ['clean title', 'nonrepairable', 'salvage title'] as const;
export const ALLOWED_TRANSMISSIONS = ['auto', 'manual'] as const;
export const ALLOWED_FUELS = ['petrol', 'diesel', 'electric', 'flexible', 'hybrid'] as const;
export const ALLOWED_DRIVES = ['front', 'rear', 'full'] as const;
export const ALLOWED_CYLINDERS = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', 'U'] as const;

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

function commaSeparatedEnum<T extends readonly string[]>(allowed: T) {
  return z
    .string()
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
// Vehicle Search Query Schema
// ---------------------------------------------------------------------------

export const vehicleSearchQuerySchema = z.object({
  // Existing filters
  make: z.string().optional(),
  model: z.string().optional(),
  search: z.string().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
  buy_now: z.string().optional(),

  // Year filter
  year: z.coerce.number().int().optional(),
  year_from: z.coerce.number().int().optional(),
  year_to: z.coerce.number().int().optional(),

  // Price filter (existing)
  price_from: z.coerce.number().min(0).optional(),
  price_to: z.coerce.number().min(0).optional(),

  // Odometer filter (maps to DB column: mileage)
  odometer_from: z.coerce.number().int().min(0).optional(),
  odometer_to: z.coerce.number().int().max(250000).optional(),

  // Legacy mileage params (for backward compatibility)
  mileage_from: z.coerce.number().int().min(0).optional(),
  mileage_to: z.coerce.number().int().optional(),

  // Title type filter (comma-separated, maps to DB column: sale_title_type)
  title_type: commaSeparatedEnum(ALLOWED_TITLE_TYPES),

  // Transmission filter (comma-separated)
  transmission: commaSeparatedEnum(ALLOWED_TRANSMISSIONS),

  // Fuel filter (comma-separated, maps to DB column: engine_fuel)
  fuel: commaSeparatedEnum(ALLOWED_FUELS),

  // Legacy fuel_type param (for backward compatibility)
  fuel_type: z.string().optional(),

  // Drive filter (comma-separated)
  drive: commaSeparatedEnum(ALLOWED_DRIVES),

  // Cylinders filter (comma-separated, kept as strings)
  cylinders: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    })
    .refine(
      (arr): arr is string[] | undefined => {
        if (!arr) return true;
        const allowedUpper = ALLOWED_CYLINDERS.map((v) => v.toUpperCase());
        return arr.every((v) => allowedUpper.includes(v));
      },
      { message: `Invalid cylinder values. Allowed: ${ALLOWED_CYLINDERS.join(', ')}` },
    ),

  // Sale date filter (maps to DB columns: sold_at_date, sold_at_time)
  sold_from: dateOrDatetime,
  sold_to: dateOrDatetime,

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
  category?: string;
  drive?: string;
  driveTypes?: string[];
  source?: string;
  buyNow?: boolean;
  vin?: string;
  sourceLotId?: string;
  titleTypes?: string[];
  transmissionTypes?: string[];
  cylinderTypes?: string[];
  soldFrom?: string;
  soldTo?: string;
}
