/**
 * Services Index
 *
 * Central export point for all application services.
 * Import services from here for clean, organized imports.
 */

export { VinDecoderService } from './VinDecoderService.js';
export { ShippingQuoteService } from './ShippingQuoteService.js';
export { GeoLocatorService } from './GeoLocatorService.js';
export { AuctionApiService } from './AuctionApiService.js';
export { FxRateService } from './FxRateService.js';
export { CalculatorService } from './CalculatorService.js';
export * from './ImageUploadService.js';

// LEGACY: Old calculation service preserved for reference only
// Do not use in new code - use ShippingQuoteService with CalculatorService instead
export { LegacyShippingQuoteService } from './legacyShippingQuoteService.js';
