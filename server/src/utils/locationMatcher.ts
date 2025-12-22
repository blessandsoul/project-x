/**
 * Location Matcher Utility
 *
 * Provides fuzzy matching between user-provided location strings (e.g., "ASHVILLE (NC)")
 * and canonical city names from /api/cities (e.g., "NC-ASHVILLE").
 *
 * Scoring rules:
 * - Exact normalized equality: 100
 * - startsWith: 90
 * - Token overlap (city + state): 80
 * - Substring includes: 70
 * - Weak overlap: 50
 * - No match: 0
 */

export interface ParsedLocation {
    state: string | null;
    city: string;
}

export interface LocationMatch {
    location: string;
    score: number;
}

/**
 * Normalize a location string for comparison.
 *
 * - Uppercase
 * - Replace _ and - with spaces
 * - Remove punctuation ( ) , .
 * - Collapse multiple spaces
 * - Handle patterns like "ASHVILLE (NC)" -> "ASHVILLE NC"
 *
 * @param str - Raw location string
 * @returns Normalized string
 */
export function normalizeLocationName(str: string): string {
    if (!str || typeof str !== 'string') {
        return '';
    }

    return str
        .toUpperCase()
        .replace(/[_\-]/g, ' ')        // Replace _ and - with spaces
        .replace(/[(),./]/g, ' ')      // Remove punctuation, replace with space
        .replace(/\s+/g, ' ')          // Collapse multiple spaces
        .trim();
}

/**
 * Parse a location string into state code and city name components.
 *
 * Handles formats:
 * - "City (ST)" -> { state: "ST", city: "CITY" }
 * - "ST-CITY" -> { state: "ST", city: "CITY" }
 * - "ST - CITY" -> { state: "ST", city: "CITY" }
 * - "ST_CITY" -> { state: "ST", city: "CITY" }
 * - "CITY" -> { state: null, city: "CITY" }
 *
 * @param input - Raw location string
 * @returns Parsed location with state and city
 */
export function parseLocationString(input: string): ParsedLocation {
    if (!input || typeof input !== 'string') {
        return { state: null, city: '' };
    }

    const str = input.trim().toUpperCase();
    let state: string | null = null;
    let city: string;

    // Pattern 1: "City Name (ST)" - state in parentheses at end
    const parenMatch = str.match(/^(.+?)\s*\(([A-Z]{2})\)\s*$/);
    if (parenMatch && parenMatch[1] && parenMatch[2]) {
        city = parenMatch[1].trim();
        state = parenMatch[2];
    }
    // Pattern 2: "ST-CITY" or "ST - CITY" or "ST_CITY" - state prefix with separator
    else if (/^[A-Z]{2}[\s\-_]+.+/.test(str)) {
        const parts = str.split(/[\s\-_]+/);
        if (parts[0] && parts[0].length === 2) {
            state = parts[0];
            city = parts.slice(1).join(' ').trim();
        } else {
            city = str;
        }
    }
    // Pattern 3: Just city name
    else {
        city = str;
    }

    // Clean up city name
    city = city
        .replace(/[\/,]/g, ' ')   // Replace / and , with space
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .replace(/\./g, '')       // Remove periods
        .trim();

    return { state, city };
}

/**
 * Calculate a match score between a user input location and a canonical location.
 *
 * @param input - User-provided location string
 * @param canonical - Canonical location from the cities table
 * @returns Score from 0-100
 */
export function scoreLocationMatch(input: string, canonical: string): number {
    if (!input || !canonical) {
        return 0;
    }

    const inputNorm = normalizeLocationName(input);
    const canonicalNorm = normalizeLocationName(canonical);

    if (!inputNorm || !canonicalNorm) {
        return 0;
    }

    // Exact normalized equality
    if (inputNorm === canonicalNorm) {
        return 100;
    }

    // Parse both to get state and city components
    const inputParsed = parseLocationString(input);
    const canonicalParsed = parseLocationString(canonical);

    // Check state match (if both have states)
    const statesMatch = inputParsed.state && canonicalParsed.state &&
        inputParsed.state === canonicalParsed.state;

    // Normalize city names for comparison
    const inputCity = normalizeLocationName(inputParsed.city);
    const canonicalCity = normalizeLocationName(canonicalParsed.city);

    // Exact city match with matching states = very high score
    if (statesMatch && inputCity === canonicalCity) {
        return 95;
    }

    // startsWith check (either direction)
    if (canonicalNorm.startsWith(inputNorm) || inputNorm.startsWith(canonicalNorm)) {
        return 90;
    }

    // City names match exactly (even if states don't match or are missing)
    if (inputCity && canonicalCity && inputCity === canonicalCity) {
        return statesMatch ? 85 : 80;
    }

    // Token overlap: check if city tokens match
    const inputCityTokens = inputCity.split(/\s+/).filter(t => t.length > 1);
    const canonicalCityTokens = canonicalCity.split(/\s+/).filter(t => t.length > 1);

    if (inputCityTokens.length > 0 && canonicalCityTokens.length > 0) {
        let matchingTokens = 0;
        for (const inputToken of inputCityTokens) {
            for (const canonicalToken of canonicalCityTokens) {
                if (inputToken === canonicalToken) {
                    matchingTokens++;
                    break;
                }
                // Partial token match (one contains the other)
                if (inputToken.includes(canonicalToken) || canonicalToken.includes(inputToken)) {
                    matchingTokens += 0.5;
                    break;
                }
            }
        }

        const maxTokens = Math.max(inputCityTokens.length, canonicalCityTokens.length);
        const tokenRatio = matchingTokens / maxTokens;

        if (tokenRatio >= 0.8) {
            // High token overlap + state match = 80, without state = 75
            return statesMatch ? 80 : 75;
        }
        if (tokenRatio >= 0.5) {
            return statesMatch ? 70 : 65;
        }
    }

    // Substring check (one contains the other)
    if (canonicalNorm.includes(inputNorm) || inputNorm.includes(canonicalNorm)) {
        return 70;
    }

    // City substring check
    if (inputCity && canonicalCity) {
        if (canonicalCity.includes(inputCity) || inputCity.includes(canonicalCity)) {
            return statesMatch ? 65 : 60;
        }
    }

    // Weak overlap: any common words
    const inputWords = inputNorm.split(/\s+/).filter(w => w.length > 2);
    const canonicalWords = canonicalNorm.split(/\s+/).filter(w => w.length > 2);

    for (const iw of inputWords) {
        if (canonicalWords.includes(iw)) {
            return 50;
        }
    }

    return 0;
}

/**
 * Find the best matching locations from a list of candidates.
 *
 * @param input - User-provided location string
 * @param candidates - Array of canonical location strings
 * @param threshold - Minimum score to include (default: 60)
 * @returns Array of matches sorted by score descending
 */
export function findBestLocationMatches(
    input: string,
    candidates: string[],
    threshold: number = 60,
): LocationMatch[] {
    if (!input || !candidates || candidates.length === 0) {
        return [];
    }

    const matches: LocationMatch[] = [];

    for (const candidate of candidates) {
        const score = scoreLocationMatch(input, candidate);
        if (score >= threshold) {
            matches.push({ location: candidate, score });
        }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
}

/**
 * Build SQL LIKE patterns for fuzzy location matching.
 * Returns patterns that can be used with SQL LIKE for DB-level filtering.
 *
 * @param input - User-provided location string
 * @returns Array of LIKE patterns
 */
export function buildLocationLikePatterns(input: string): string[] {
    const parsed = parseLocationString(input);
    const patterns: string[] = [];

    const normalizedCity = normalizeLocationName(parsed.city);
    const cityTokens = normalizedCity.split(/\s+/).filter(t => t.length > 1);

    // Pattern for the full normalized city name
    if (normalizedCity) {
        patterns.push(`%${normalizedCity}%`);
    }

    // Individual significant tokens
    for (const token of cityTokens) {
        if (token.length >= 3) {
            patterns.push(`%${token}%`);
        }
    }

    // If we have a state, add state-prefixed pattern
    if (parsed.state) {
        patterns.push(`%${parsed.state}%`);
        if (normalizedCity) {
            // Also try state-city pattern
            patterns.push(`%${parsed.state}%${normalizedCity}%`);
        }
    }

    // Deduplicate
    return [...new Set(patterns)];
}
