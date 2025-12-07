import { FastifyInstance } from 'fastify';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { ValidationError } from '../types/errors.js';

/**
 * Calculator request body as expected by POST /api/calculator
 */
export interface CalculatorRequestBody {
  buyprice: number;
  auction: string;
  vehicletype: string;
  usacity?: string;
  coparturl?: string;
  destinationport: string;
  vehiclecategory: string;
}

/**
 * Input from client for /vehicles/:vehicleId/calculate-quotes
 */
export interface CalculateQuotesInput {
  auction: string;
  usacity: string;
}

/**
 * Result of building a calculator request
 * - success: true with request body if all inputs could be normalized
 * - success: false with error message if normalization failed
 */
export interface BuildCalculatorRequestResult {
  success: boolean;
  request?: CalculatorRequestBody;
  error?: string;
  /** Original input city that couldn't be matched (for logging) */
  unmatchedCity?: string;
}

interface CityRow extends RowDataPacket {
  city: string;
}

interface AuctionRow extends RowDataPacket {
  auction: string;
}

/**
 * CalculatorRequestBuilder
 * 
 * Single source of truth for building calculator API requests.
 * Handles all normalization, validation, and smart matching for:
 * - Auction names (case-sensitive matching to /api/auctions values)
 * - City names (smart matching to /api/cities values)
 * - Default values for all calculator fields
 * 
 * IMPORTANT: The external calculator API is strict and case-sensitive.
 * All values must exactly match the canonical values from our APIs.
 */
export class CalculatorRequestBuilder {
  private fastify: FastifyInstance;
  
  // Cache for canonical values (loaded once per instance)
  private canonicalCities: string[] | null = null;
  private canonicalAuctions: string[] | null = null;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get db(): Pool {
    return this.fastify.mysql;
  }

  // ============================================================================
  // AUCTION NORMALIZATION
  // ============================================================================

  /**
   * Get canonical auction names from database
   */
  private async getCanonicalAuctions(): Promise<string[]> {
    if (this.canonicalAuctions) {
      return this.canonicalAuctions;
    }

    try {
      const [rows] = await this.db.execute<AuctionRow[]>(
        'SELECT auction FROM auctions'
      );
      this.canonicalAuctions = rows.map(row => row.auction);
      this.fastify.log.info(
        { count: this.canonicalAuctions.length },
        'Loaded canonical auctions from database'
      );
      return this.canonicalAuctions;
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to load auctions from database');
      // Fallback to known auctions if DB fails
      return ['Copart', 'IAAI', 'Manheim', 'Adesa'];
    }
  }

  /**
   * Normalize auction name to canonical format
   * 
   * Input examples: "copart", "COPART", "iaai", "IAAI"
   * Output: "Copart", "IAAI" (exact match from /api/auctions)
   * 
   * @throws ValidationError if auction cannot be matched
   */
  async normalizeAuction(rawAuction: string): Promise<string> {
    if (!rawAuction || typeof rawAuction !== 'string') {
      throw new ValidationError(
        'Auction is required. Please provide a valid auction name (e.g., "Copart" or "IAAI").'
      );
    }

    const input = rawAuction.trim().toLowerCase();
    const canonicalAuctions = await this.getCanonicalAuctions();

    // Try exact match (case-insensitive)
    for (const canonical of canonicalAuctions) {
      if (canonical.toLowerCase() === input) {
        this.fastify.log.debug(
          { input: rawAuction, canonical },
          'Auction matched exactly'
        );
        return canonical;
      }
    }

    // Common aliases
    const aliases: Record<string, string> = {
      'copart': 'Copart',
      'iaai': 'IAAI',
      'insurance auto auctions': 'IAAI',
      'manheim': 'Manheim',
      'adesa': 'Adesa',
    };

    if (aliases[input]) {
      const canonical = aliases[input];
      // Verify it exists in our canonical list
      if (canonicalAuctions.some(a => a.toLowerCase() === canonical.toLowerCase())) {
        this.fastify.log.debug(
          { input: rawAuction, canonical },
          'Auction matched via alias'
        );
        return canonical;
      }
    }

    // No match found
    this.fastify.log.warn(
      { input: rawAuction, availableAuctions: canonicalAuctions },
      'Could not match auction to canonical value'
    );
    throw new ValidationError(
      `Invalid auction "${rawAuction}". Supported auctions: ${canonicalAuctions.join(', ')}`
    );
  }

  // ============================================================================
  // CITY SMART MATCHING
  // ============================================================================

  /**
   * Get canonical city names from database
   */
  private async getCanonicalCities(): Promise<string[]> {
    if (this.canonicalCities) {
      return this.canonicalCities;
    }

    try {
      const [rows] = await this.db.execute<CityRow[]>(
        'SELECT city FROM cities'
      );
      this.canonicalCities = rows.map(row => row.city);
      this.fastify.log.info(
        { count: this.canonicalCities.length },
        'Loaded canonical cities from database'
      );
      return this.canonicalCities;
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to load cities from database');
      return [];
    }
  }

  /**
   * Parse a city string into components (state code and city name)
   * 
   * Handles formats:
   * - "Permian Basin (TX)" -> { state: "TX", city: "PERMIAN BASIN" }
   * - "TX - PERMIAN BASIN" -> { state: "TX", city: "PERMIAN BASIN" }
   * - "TX-PERMIAN BASIN" -> { state: "TX", city: "PERMIAN BASIN" }
   * - "Dallas/ft Worth (TX)" -> { state: "TX", city: "DALLAS FT WORTH" }
   * - "FL - Miami South" -> { state: "FL", city: "MIAMI SOUTH" }
   */
  private parseCityString(input: string): { state: string | null; city: string } {
    const str = input.trim().toUpperCase();
    let state: string | null = null;
    let city: string;

    // Pattern 1: "City Name (ST)" - state in parentheses at end
    const parenMatch = str.match(/^(.+?)\s*\(([A-Z]{2})\)\s*$/);
    if (parenMatch && parenMatch[1] && parenMatch[2]) {
      city = parenMatch[1].trim();
      state = parenMatch[2];
    }
    // Pattern 2: "ST - City Name" or "ST-City Name" - state prefix with hyphen
    else if (/^[A-Z]{2}\s*-\s*.+/.test(str)) {
      const parts = str.split(/\s*-\s*/);
      state = parts[0]?.trim() || null;
      city = parts.slice(1).join('-').trim();
    }
    // Pattern 3: "ST\tCity Name" - state prefix with tab (seen in data)
    else if (/^[A-Z]{2}\t.+/.test(str)) {
      const parts = str.split('\t');
      state = parts[0]?.trim() || null;
      city = parts.slice(1).join(' ').trim();
    }
    // Pattern 4: Just city name
    else {
      city = str;
    }

    // Clean up city name
    city = city
      .replace(/[\/,]/g, ' ')  // Replace / and , with space
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .replace(/\./g, '')       // Remove periods
      .trim();

    return { state, city };
  }

  /**
   * Normalize city name for comparison
   * Removes common variations and noise
   */
  private normalizeCityName(city: string): string {
    return city
      .toUpperCase()
      .replace(/[\/,\.\-]/g, ' ')  // Replace punctuation with space
      .replace(/\s+/g, ' ')         // Normalize whitespace
      .replace(/\b(NORTH|SOUTH|EAST|WEST|CENTRAL)\b/g, (m) => m.charAt(0))  // Abbreviate directions for matching
      .trim();
  }

  /**
   * Calculate how well two city strings match (0-1 score)
   */
  private calculateCityMatchScore(input: string, canonical: string): number {
    const inputNorm = this.normalizeCityName(input);
    const canonicalNorm = this.normalizeCityName(canonical);

    // Exact match
    if (inputNorm === canonicalNorm) return 1.0;

    // One contains the other completely
    if (inputNorm.includes(canonicalNorm) || canonicalNorm.includes(inputNorm)) {
      return 0.9;
    }

    // Word-based matching
    const inputWords = inputNorm.split(/\s+/).filter(w => w.length > 1);
    const canonicalWords = canonicalNorm.split(/\s+/).filter(w => w.length > 1);

    if (inputWords.length === 0 || canonicalWords.length === 0) return 0;

    // Count matching words
    let matchCount = 0;
    for (const iw of inputWords) {
      for (const cw of canonicalWords) {
        if (iw === cw || iw.includes(cw) || cw.includes(iw)) {
          matchCount++;
          break;
        }
      }
    }

    // Score based on proportion of matching words
    const maxWords = Math.max(inputWords.length, canonicalWords.length);
    return matchCount / maxWords;
  }

  /**
   * Smart match a noisy city input to a canonical city from /api/cities
   * 
   * The canonical cities use format: "TX-PERMIAN BASIN", "CA-LOS ANGELES"
   * Vehicle yard names use formats: "Permian Basin (TX)", "Los angeles (CA)"
   * 
   * Matching strategy:
   * 1. Parse both input and canonical into state + city components
   * 2. If states match, compare city names
   * 3. If no state in input, search all cities
   * 4. Use fuzzy matching for city name comparison
   * 
   * @returns Canonical city string or null if no match
   */
  async matchUsaCity(inputCity: string): Promise<string | null> {
    if (!inputCity || typeof inputCity !== 'string') {
      return null;
    }

    const canonicalCities = await this.getCanonicalCities();
    if (canonicalCities.length === 0) {
      this.fastify.log.warn('No canonical cities loaded, cannot match');
      return null;
    }

    const inputParsed = this.parseCityString(inputCity);
    
    this.fastify.log.debug(
      { inputCity, parsed: inputParsed },
      'Attempting to match city'
    );

    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const canonical of canonicalCities) {
      const canonicalParsed = this.parseCityString(canonical);

      // If input has a state, only consider cities in that state
      if (inputParsed.state && canonicalParsed.state) {
        if (inputParsed.state !== canonicalParsed.state) {
          continue; // Skip cities in different states
        }
      }

      // Calculate match score for city names
      const score = this.calculateCityMatchScore(inputParsed.city, canonicalParsed.city);

      // Boost score if states match
      const stateBoost = (inputParsed.state && inputParsed.state === canonicalParsed.state) ? 0.1 : 0;
      const finalScore = Math.min(1.0, score + stateBoost);

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMatch = canonical;
      }
    }

    // Require a minimum match threshold
    const MATCH_THRESHOLD = 0.6;
    
    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      this.fastify.log.info(
        { inputCity, matchedCity: bestMatch, score: bestScore },
        'City matched successfully'
      );
      return bestMatch;
    }

    this.fastify.log.warn(
      { inputCity, parsed: inputParsed, bestMatch, bestScore },
      'Could not match city to any canonical value (below threshold)'
    );
    return null;
  }

  // ============================================================================
  // REQUEST BUILDING
  // ============================================================================

  /**
   * Build a complete calculator request body with all defaults and normalizations
   * 
   * This is the SINGLE SOURCE OF TRUTH for calculator request building.
   * Returns a result object instead of throwing, so callers can handle
   * unmatched cities gracefully.
   * 
   * @param input - Client input (auction, usacity)
   * @param options - Optional overrides for advanced use cases
   * @returns Result object with success status and either request or error
   */
  async buildCalculatorRequest(
    input: CalculateQuotesInput,
    options?: {
      buyprice?: number;
      vehicletype?: string;
      vehiclecategory?: string;
      destinationport?: string;
      coparturl?: string;
    }
  ): Promise<BuildCalculatorRequestResult> {
    // Normalize auction (required)
    let normalizedAuction: string;
    try {
      normalizedAuction = await this.normalizeAuction(input.auction);
    } catch (error) {
      return {
        success: false,
        error: `Invalid auction "${input.auction}". Please use "Copart" or "IAAI".`,
      };
    }

    // Smart match city
    const matchedCity = await this.matchUsaCity(input.usacity);
    if (!matchedCity) {
      this.fastify.log.warn(
        { inputCity: input.usacity },
        'Could not match city - price calculation will not be available'
      );
      return {
        success: false,
        error: `Could not match city "${input.usacity}" to a supported location. Price calculation is not available for this location.`,
        unmatchedCity: input.usacity,
      };
    }

    // Build request with strict defaults
    const request: CalculatorRequestBody = {
      // Always 1 for this endpoint (price doesn't affect shipping calculation)
      buyprice: options?.buyprice ?? 1,
      
      // Normalized auction (case-sensitive, must match /api/auctions)
      auction: normalizedAuction,
      
      // Default to "standard" (only "standard" or "heavy" allowed)
      vehicletype: options?.vehicletype ?? 'standard',
      
      // Matched canonical city from /api/cities
      usacity: matchedCity,
      
      // Default to "POTI" (uppercase)
      destinationport: options?.destinationport ?? 'POTI',
      
      // Default to "Sedan" (case-sensitive)
      vehiclecategory: options?.vehiclecategory ?? 'Sedan',
    };

    // Add optional coparturl if provided
    if (options?.coparturl) {
      request.coparturl = options.coparturl;
    }

    this.fastify.log.info(
      { 
        input,
        normalizedAuction,
        matchedCity,
        request 
      },
      'Built calculator request successfully'
    );

    return {
      success: true,
      request,
    };
  }

  /**
   * Validate that a vehicle type is valid for the calculator
   */
  isValidVehicleType(vehicleType: string): boolean {
    return vehicleType === 'standard' || vehicleType === 'heavy';
  }

  /**
   * Validate that a vehicle category is valid for the calculator
   */
  isValidVehicleCategory(category: string): boolean {
    const validCategories = ['Sedan', 'Bike', 'Small SUV', 'Big SUV', 'Pickup', 'Van', 'Big Van'];
    return validCategories.includes(category);
  }
}
