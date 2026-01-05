/**
 * Vehicle Model Canonicalization Engine
 * 
 * This module provides deterministic canonicalization for vehicle makes and models.
 * All variants of a model name map to a SINGLE canonical representation.
 * 
 * Used during:
 * - Auction ingestion (to populate canonical_brand, canonical_model_key)
 * - Never during runtime search (search uses pre-computed canonical keys)
 */

// ============================================================================
// BRAND CANONICALIZATION MAP
// ============================================================================

/**
 * Maps raw brand names to their canonical form.
 * Key: lowercase normalized, Value: { brand, key }
 */
const BRAND_ALIASES: Record<string, { brand: string; key: string }> = {
    // Mercedes variations
    'mercedes benz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
    'mercedesbenz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
    'mercedes-benz': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
    'mercedes': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },
    'mb': { brand: 'Mercedes-Benz', key: 'mercedesbenz' },

    // BMW variations
    'bmw': { brand: 'BMW', key: 'bmw' },
    'b.m.w.': { brand: 'BMW', key: 'bmw' },

    // Chevrolet variations
    'chevrolet': { brand: 'Chevrolet', key: 'chevrolet' },
    'chevy': { brand: 'Chevrolet', key: 'chevrolet' },
    'chev': { brand: 'Chevrolet', key: 'chevrolet' },

    // Volkswagen variations
    'volkswagen': { brand: 'Volkswagen', key: 'volkswagen' },
    'vw': { brand: 'Volkswagen', key: 'volkswagen' },

    // Land Rover variations
    'land rover': { brand: 'Land Rover', key: 'landrover' },
    'landrover': { brand: 'Land Rover', key: 'landrover' },

    // Alfa Romeo variations
    'alfa romeo': { brand: 'Alfa Romeo', key: 'alfaromeo' },
    'alfaromeo': { brand: 'Alfa Romeo', key: 'alfaromeo' },
    'alfa': { brand: 'Alfa Romeo', key: 'alfaromeo' },

    // Aston Martin variations
    'aston martin': { brand: 'Aston Martin', key: 'astonmartin' },
    'astonmartin': { brand: 'Aston Martin', key: 'astonmartin' },

    // Harley-Davidson variations
    'harley-davidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
    'harley davidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
    'harleydavidson': { brand: 'Harley-Davidson', key: 'harleydavidson' },
    'harley': { brand: 'Harley-Davidson', key: 'harleydavidson' },

    // Rolls-Royce variations
    'rolls-royce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
    'rolls royce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
    'rollsroyce': { brand: 'Rolls-Royce', key: 'rollsroyce' },
};

// ============================================================================
// MODEL CANONICALIZATION PATTERNS
// ============================================================================

/**
 * Model family patterns for specific brands.
 * These define how to extract the core model identity.
 */
const MODEL_PATTERNS: Record<string, Array<{ pattern: RegExp; family: string; displayName: string }>> = {
    'mercedesbenz': [
        { pattern: /^c[\s-]?class/i, family: 'cclass', displayName: 'C-Class' },
        { pattern: /^e[\s-]?class/i, family: 'eclass', displayName: 'E-Class' },
        { pattern: /^s[\s-]?class/i, family: 'sclass', displayName: 'S-Class' },
        { pattern: /^a[\s-]?class/i, family: 'aclass', displayName: 'A-Class' },
        { pattern: /^b[\s-]?class/i, family: 'bclass', displayName: 'B-Class' },
        { pattern: /^g[\s-]?class/i, family: 'gclass', displayName: 'G-Class' },
        { pattern: /^cla[\s-]?/i, family: 'cla', displayName: 'CLA' },
        { pattern: /^clk[\s-]?/i, family: 'clk', displayName: 'CLK' },
        { pattern: /^cls[\s-]?/i, family: 'cls', displayName: 'CLS' },
        { pattern: /^glc[\s-]?/i, family: 'glc', displayName: 'GLC' },
        { pattern: /^gle[\s-]?/i, family: 'gle', displayName: 'GLE' },
        { pattern: /^gls[\s-]?/i, family: 'gls', displayName: 'GLS' },
        { pattern: /^gla[\s-]?/i, family: 'gla', displayName: 'GLA' },
        { pattern: /^glb[\s-]?/i, family: 'glb', displayName: 'GLB' },
        { pattern: /^sl[\s-]?/i, family: 'sl', displayName: 'SL' },
        { pattern: /^slc[\s-]?/i, family: 'slc', displayName: 'SLC' },
        { pattern: /^slk[\s-]?/i, family: 'slk', displayName: 'SLK' },
        { pattern: /^amg[\s-]?gt/i, family: 'amggt', displayName: 'AMG GT' },
        { pattern: /^eqe[\s-]?/i, family: 'eqe', displayName: 'EQE' },
        { pattern: /^eqs[\s-]?/i, family: 'eqs', displayName: 'EQS' },
        { pattern: /^eqc[\s-]?/i, family: 'eqc', displayName: 'EQC' },
        { pattern: /^eqa[\s-]?/i, family: 'eqa', displayName: 'EQA' },
        { pattern: /^eqb[\s-]?/i, family: 'eqb', displayName: 'EQB' },
        { pattern: /^ml[\s-]?/i, family: 'ml', displayName: 'ML' },
        { pattern: /^gl[\s-]?/i, family: 'gl', displayName: 'GL' },
        { pattern: /^maybach/i, family: 'maybach', displayName: 'Maybach' },
        { pattern: /^sprinter/i, family: 'sprinter', displayName: 'Sprinter' },
        { pattern: /^metris/i, family: 'metris', displayName: 'Metris' },
    ],
    'bmw': [
        { pattern: /^1[\s-]?series/i, family: '1series', displayName: '1 Series' },
        { pattern: /^2[\s-]?series/i, family: '2series', displayName: '2 Series' },
        { pattern: /^3[\s-]?series/i, family: '3series', displayName: '3 Series' },
        { pattern: /^4[\s-]?series/i, family: '4series', displayName: '4 Series' },
        { pattern: /^5[\s-]?series/i, family: '5series', displayName: '5 Series' },
        { pattern: /^6[\s-]?series/i, family: '6series', displayName: '6 Series' },
        { pattern: /^7[\s-]?series/i, family: '7series', displayName: '7 Series' },
        { pattern: /^8[\s-]?series/i, family: '8series', displayName: '8 Series' },
        // Trim-based models that map to series
        { pattern: /^3\d{2}[deix]*/i, family: '3series', displayName: '3 Series' }, // 320i, 330d, etc.
        { pattern: /^5\d{2}[deix]*/i, family: '5series', displayName: '5 Series' }, // 520i, 530d, etc.
        { pattern: /^7\d{2}[deix]*/i, family: '7series', displayName: '7 Series' }, // 740i, 750Li, etc.
        // M models
        { pattern: /^m2\b/i, family: 'm2', displayName: 'M2' },
        { pattern: /^m3\b/i, family: 'm3', displayName: 'M3' },
        { pattern: /^m4\b/i, family: 'm4', displayName: 'M4' },
        { pattern: /^m5\b/i, family: 'm5', displayName: 'M5' },
        { pattern: /^m6\b/i, family: 'm6', displayName: 'M6' },
        { pattern: /^m8\b/i, family: 'm8', displayName: 'M8' },
        // X models
        { pattern: /^x1\b/i, family: 'x1', displayName: 'X1' },
        { pattern: /^x2\b/i, family: 'x2', displayName: 'X2' },
        { pattern: /^x3\b/i, family: 'x3', displayName: 'X3' },
        { pattern: /^x4\b/i, family: 'x4', displayName: 'X4' },
        { pattern: /^x5\b/i, family: 'x5', displayName: 'X5' },
        { pattern: /^x6\b/i, family: 'x6', displayName: 'X6' },
        { pattern: /^x7\b/i, family: 'x7', displayName: 'X7' },
        // Electric
        { pattern: /^i3\b/i, family: 'i3', displayName: 'i3' },
        { pattern: /^i4\b/i, family: 'i4', displayName: 'i4' },
        { pattern: /^i5\b/i, family: 'i5', displayName: 'i5' },
        { pattern: /^i7\b/i, family: 'i7', displayName: 'i7' },
        { pattern: /^i8\b/i, family: 'i8', displayName: 'i8' },
        { pattern: /^ix\b/i, family: 'ix', displayName: 'iX' },
        // Z models
        { pattern: /^z3\b/i, family: 'z3', displayName: 'Z3' },
        { pattern: /^z4\b/i, family: 'z4', displayName: 'Z4' },
    ],
    'ford': [
        { pattern: /^f[\s-]?150/i, family: 'f150', displayName: 'F-150' },
        { pattern: /^f[\s-]?250/i, family: 'f250', displayName: 'F-250' },
        { pattern: /^f[\s-]?350/i, family: 'f350', displayName: 'F-350' },
        { pattern: /^f[\s-]?450/i, family: 'f450', displayName: 'F-450' },
        { pattern: /^mustang/i, family: 'mustang', displayName: 'Mustang' },
        { pattern: /^explorer/i, family: 'explorer', displayName: 'Explorer' },
        { pattern: /^escape/i, family: 'escape', displayName: 'Escape' },
        { pattern: /^edge/i, family: 'edge', displayName: 'Edge' },
        { pattern: /^fusion/i, family: 'fusion', displayName: 'Fusion' },
        { pattern: /^focus/i, family: 'focus', displayName: 'Focus' },
        { pattern: /^bronco/i, family: 'bronco', displayName: 'Bronco' },
        { pattern: /^ranger/i, family: 'ranger', displayName: 'Ranger' },
        { pattern: /^expedition/i, family: 'expedition', displayName: 'Expedition' },
        { pattern: /^maverick/i, family: 'maverick', displayName: 'Maverick' },
        { pattern: /^transit/i, family: 'transit', displayName: 'Transit' },
        { pattern: /^mach[\s-]?e/i, family: 'mache', displayName: 'Mustang Mach-E' },
    ],
    'toyota': [
        { pattern: /^camry/i, family: 'camry', displayName: 'Camry' },
        { pattern: /^corolla/i, family: 'corolla', displayName: 'Corolla' },
        { pattern: /^rav[\s-]?4/i, family: 'rav4', displayName: 'RAV4' },
        { pattern: /^highlander/i, family: 'highlander', displayName: 'Highlander' },
        { pattern: /^tacoma/i, family: 'tacoma', displayName: 'Tacoma' },
        { pattern: /^tundra/i, family: 'tundra', displayName: 'Tundra' },
        { pattern: /^4[\s-]?runner/i, family: '4runner', displayName: '4Runner' },
        { pattern: /^prius/i, family: 'prius', displayName: 'Prius' },
        { pattern: /^avalon/i, family: 'avalon', displayName: 'Avalon' },
        { pattern: /^sienna/i, family: 'sienna', displayName: 'Sienna' },
        { pattern: /^supra/i, family: 'supra', displayName: 'Supra' },
        { pattern: /^gr[\s-]?86/i, family: 'gr86', displayName: 'GR86' },
        { pattern: /^venza/i, family: 'venza', displayName: 'Venza' },
        { pattern: /^sequoia/i, family: 'sequoia', displayName: 'Sequoia' },
        { pattern: /^land[\s-]?cruiser/i, family: 'landcruiser', displayName: 'Land Cruiser' },
        { pattern: /^crown/i, family: 'crown', displayName: 'Crown' },
    ],
    'honda': [
        { pattern: /^accord/i, family: 'accord', displayName: 'Accord' },
        { pattern: /^civic/i, family: 'civic', displayName: 'Civic' },
        { pattern: /^cr[\s-]?v/i, family: 'crv', displayName: 'CR-V' },
        { pattern: /^hr[\s-]?v/i, family: 'hrv', displayName: 'HR-V' },
        { pattern: /^pilot/i, family: 'pilot', displayName: 'Pilot' },
        { pattern: /^passport/i, family: 'passport', displayName: 'Passport' },
        { pattern: /^odyssey/i, family: 'odyssey', displayName: 'Odyssey' },
        { pattern: /^ridgeline/i, family: 'ridgeline', displayName: 'Ridgeline' },
        { pattern: /^fit/i, family: 'fit', displayName: 'Fit' },
        { pattern: /^insight/i, family: 'insight', displayName: 'Insight' },
        { pattern: /^prologue/i, family: 'prologue', displayName: 'Prologue' },
    ],
    'chevrolet': [
        { pattern: /^silverado/i, family: 'silverado', displayName: 'Silverado' },
        { pattern: /^tahoe/i, family: 'tahoe', displayName: 'Tahoe' },
        { pattern: /^suburban/i, family: 'suburban', displayName: 'Suburban' },
        { pattern: /^equinox/i, family: 'equinox', displayName: 'Equinox' },
        { pattern: /^traverse/i, family: 'traverse', displayName: 'Traverse' },
        { pattern: /^malibu/i, family: 'malibu', displayName: 'Malibu' },
        { pattern: /^camaro/i, family: 'camaro', displayName: 'Camaro' },
        { pattern: /^corvette/i, family: 'corvette', displayName: 'Corvette' },
        { pattern: /^colorado/i, family: 'colorado', displayName: 'Colorado' },
        { pattern: /^blazer/i, family: 'blazer', displayName: 'Blazer' },
        { pattern: /^trailblazer/i, family: 'trailblazer', displayName: 'Trailblazer' },
        { pattern: /^bolt/i, family: 'bolt', displayName: 'Bolt' },
        { pattern: /^spark/i, family: 'spark', displayName: 'Spark' },
        { pattern: /^impala/i, family: 'impala', displayName: 'Impala' },
        { pattern: /^cruze/i, family: 'cruze', displayName: 'Cruze' },
    ],
    'audi': [
        { pattern: /^a3\b/i, family: 'a3', displayName: 'A3' },
        { pattern: /^a4\b/i, family: 'a4', displayName: 'A4' },
        { pattern: /^a5\b/i, family: 'a5', displayName: 'A5' },
        { pattern: /^a6\b/i, family: 'a6', displayName: 'A6' },
        { pattern: /^a7\b/i, family: 'a7', displayName: 'A7' },
        { pattern: /^a8\b/i, family: 'a8', displayName: 'A8' },
        { pattern: /^q3\b/i, family: 'q3', displayName: 'Q3' },
        { pattern: /^q4\b/i, family: 'q4', displayName: 'Q4' },
        { pattern: /^q5\b/i, family: 'q5', displayName: 'Q5' },
        { pattern: /^q7\b/i, family: 'q7', displayName: 'Q7' },
        { pattern: /^q8\b/i, family: 'q8', displayName: 'Q8' },
        { pattern: /^e[\s-]?tron/i, family: 'etron', displayName: 'e-tron' },
        { pattern: /^rs[\s-]?3/i, family: 'rs3', displayName: 'RS3' },
        { pattern: /^rs[\s-]?4/i, family: 'rs4', displayName: 'RS4' },
        { pattern: /^rs[\s-]?5/i, family: 'rs5', displayName: 'RS5' },
        { pattern: /^rs[\s-]?6/i, family: 'rs6', displayName: 'RS6' },
        { pattern: /^rs[\s-]?7/i, family: 'rs7', displayName: 'RS7' },
        { pattern: /^s3\b/i, family: 's3', displayName: 'S3' },
        { pattern: /^s4\b/i, family: 's4', displayName: 'S4' },
        { pattern: /^s5\b/i, family: 's5', displayName: 'S5' },
        { pattern: /^s6\b/i, family: 's6', displayName: 'S6' },
        { pattern: /^s7\b/i, family: 's7', displayName: 'S7' },
        { pattern: /^s8\b/i, family: 's8', displayName: 'S8' },
        { pattern: /^tt\b/i, family: 'tt', displayName: 'TT' },
        { pattern: /^r8\b/i, family: 'r8', displayName: 'R8' },
    ],
    'porsche': [
        { pattern: /^911\b/i, family: '911', displayName: '911' },
        { pattern: /^cayenne/i, family: 'cayenne', displayName: 'Cayenne' },
        { pattern: /^macan/i, family: 'macan', displayName: 'Macan' },
        { pattern: /^panamera/i, family: 'panamera', displayName: 'Panamera' },
        { pattern: /^taycan/i, family: 'taycan', displayName: 'Taycan' },
        { pattern: /^boxster/i, family: 'boxster', displayName: 'Boxster' },
        { pattern: /^cayman/i, family: 'cayman', displayName: 'Cayman' },
        { pattern: /^718\b/i, family: '718', displayName: '718' },
    ],
};

// ============================================================================
// CORE CANONICALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize a string for key generation.
 * Removes all non-alphanumeric characters and converts to lowercase.
 */
function toKey(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Canonicalize a brand name.
 * Returns { brand, key } where brand is the display name and key is the search key.
 */
export function canonicalizeBrand(rawBrand: string): { brand: string; key: string } {
    if (!rawBrand) {
        return { brand: 'Unknown', key: 'unknown' };
    }

    const normalized = rawBrand.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Check alias map first
    const alias = BRAND_ALIASES[normalized];
    if (alias) {
        return alias;
    }

    // Check without spaces
    const noSpaces = normalized.replace(/\s+/g, '');
    const aliasNoSpaces = BRAND_ALIASES[noSpaces];
    if (aliasNoSpaces) {
        return aliasNoSpaces;
    }

    // Default: Title case the brand, generate key
    const titleCase = rawBrand
        .split(/[\s-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return {
        brand: titleCase,
        key: toKey(rawBrand),
    };
}

/**
 * Canonicalize a model name for a given brand.
 * Returns { modelKey, displayName } where modelKey is for search and displayName is for UI.
 */
export function canonicalizeModel(
    rawModel: string,
    brandKey: string,
): { modelKey: string; displayName: string } {
    if (!rawModel) {
        return { modelKey: 'unknown', displayName: 'Unknown' };
    }

    const trimmed = rawModel.trim();

    // Check brand-specific patterns
    const brandPatterns = MODEL_PATTERNS[brandKey];
    if (brandPatterns) {
        for (const { pattern, family, displayName } of brandPatterns) {
            if (pattern.test(trimmed)) {
                return { modelKey: family, displayName };
            }
        }
    }

    // Default: Generate key and clean display name
    const key = toKey(trimmed);

    // Clean display name: remove extra spaces, normalize hyphens
    const displayName = trimmed
        .replace(/\s+/g, ' ')
        .trim();

    return { modelKey: key, displayName };
}

/**
 * Full canonicalization of a vehicle's make and model.
 * This is the main function to use during ingestion.
 */
export interface CanonicalVehicle {
    canonical_brand: string;
    canonical_brand_key: string;
    canonical_model_key: string;
    canonical_display_name: string;
}

export function canonicalizeVehicle(
    rawBrand: string,
    rawModel: string,
): CanonicalVehicle {
    const { brand, key: brandKey } = canonicalizeBrand(rawBrand);
    const { modelKey, displayName } = canonicalizeModel(rawModel, brandKey);

    return {
        canonical_brand: brand,
        canonical_brand_key: brandKey,
        canonical_model_key: modelKey,
        canonical_display_name: displayName,
    };
}

/**
 * Generate canonical model key from any variant.
 * Use this to convert user search input to canonical form.
 */
export function toCanonicalModelKey(rawBrand: string, rawModel: string): string {
    const { key: brandKey } = canonicalizeBrand(rawBrand);
    const { modelKey } = canonicalizeModel(rawModel, brandKey);
    return modelKey;
}

/**
 * Generate canonical brand key from any variant.
 */
export function toCanonicalBrandKey(rawBrand: string): string {
    const { key } = canonicalizeBrand(rawBrand);
    return key;
}
