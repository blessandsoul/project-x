/**
 * VIN Decoder Types
 *
 * TypeScript interfaces for NHTSA VPIC API responses
 * and VIN decoder service interactions.
 */

/**
 * Raw response structure from NHTSA VPIC API
 */
export interface NHTSAResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: VINData[];
}

/**
 * Individual VIN data structure returned by NHTSA
 */
export interface VINData {
  // Basic vehicle identification
  VIN: string;
  ModelYear: string;
  Make: string;
  Model: string;
  Trim: string;
  Series: string;

  // Vehicle details
  VehicleType: string;
  BodyClass: string;
  Doors: string;
  DriveType: string;
  FuelTypePrimary: string;
  EngineConfiguration: string;
  EngineCylinders: string;
  DisplacementL: string;

  // Manufacturing details
  PlantCountry: string;
  PlantCompanyName: string;
  PlantState: string;

  // Safety and features
  AirBagLocFront: string;
  AirBagLocSide: string;
  SeatBeltsAll: string;
  ABS: string;
  ESC: string;

  // Additional fields that may be present
  ErrorCode?: string;
  ErrorText?: string;
  AdditionalErrorText?: string;
}

/**
 * Cleaned up VIN information for application use
 */
export interface VINInfo {
  vin: string;
  year: number | null;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  vehicleType: string;
  doors: number | null;
  driveType: string;
  fuelType: string;
  engine: {
    configuration: string;
    cylinders: number | null;
    displacementL: number | null;
  };
  manufacturer: {
    plantCountry: string;
    plantState: string;
    companyName: string;
  };
  safety: {
    abs: boolean;
    esc: boolean;
    airbags: string;
    seatbelts: string;
  };
}

/**
 * VIN decoder service response
 */
export interface VINDecoderResponse {
  success: boolean;
  data?: VINInfo;
  error?: string;
  source: 'NHTSA_VPIC';
  timestamp: string;
}
