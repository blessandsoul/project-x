/**
 * String normalization utilities for fuzzy matching vehicle makes and models.
 * 
 * Problem: Our vehicle_models table has "C-Class" but Copart stores "C Class" in vehicles.
 * Solution: Normalize both sides during comparison to handle variations:
 * - Hyphens vs spaces: "C-Class" ↔ "C Class"
 * - Case differences: "C-CLASS" ↔ "c-class"
 * - Multiple spaces: "C  Class" → "C Class"
 * - Special characters: "C/Class" → "CClass"
 */

/**
 * Normalize a string for comparison purposes.
 * Converts to lowercase, removes special characters (except letters/numbers/spaces),
 * collapses multiple spaces to single space, and trims.
 * 
 * Examples:
 * - "C-Class" → "c class"
 * - "C Class" → "c class"
 * - "3 Series" → "3 series"
 * - "CAYENNE" → "cayenne"
 * - "911 GT3-RS" → "911 gt3 rs"
 */
export function normalizeForComparison(str: string): string {
    if (!str) return '';

    return str
        .toLowerCase()
        // Replace hyphens, underscores, slashes with spaces
        .replace(/[-_/\\]/g, ' ')
        // Remove any other non-alphanumeric characters (except spaces)
        .replace(/[^a-z0-9\s]/g, '')
        // Collapse multiple spaces to single space
        .replace(/\s+/g, ' ')
        // Trim leading/trailing spaces
        .trim();
}

/**
 * Create a SQL LIKE pattern for fuzzy matching.
 * Returns a pattern that matches the normalized form.
 * 
 * For "C-Class", this returns a pattern that would match:
 * - "C-Class"
 * - "C Class"
 * - "C CLASS"
 * - "c-class"
 */
export function createFuzzyLikePattern(str: string): string {
    if (!str) return '%';

    const normalized = normalizeForComparison(str);
    // Split into words and create a pattern that matches each word
    // This allows for variations in separators
    const words = normalized.split(' ').filter(Boolean);

    if (words.length === 0) return '%';
    if (words.length === 1) return `%${words[0]}%`;

    // For multi-word, create a pattern like: %word1%word2%
    return `%${words.join('%')}%`;
}

/**
 * Build SQL conditions for fuzzy model matching.
 * Returns conditions and params for matching a model name with variations.
 * 
 * @param columnName - The SQL column to match against (e.g., 'model_name')
 * @param searchValue - The value to search for (e.g., 'C-Class')
 * @returns Object with SQL condition string and array of params
 */
export function buildFuzzyModelCondition(
    columnName: string,
    searchValue: string,
): { condition: string; params: string[] } {
    const normalized = normalizeForComparison(searchValue);
    const words = normalized.split(' ').filter(Boolean);

    if (words.length === 0) {
        return { condition: '1=1', params: [] };
    }

    // Strategy: Match if all words exist in the column value (in order)
    // This handles: "C-Class" matching "C Class" and vice versa
    // Using REPLACE to normalize the DB value too

    // Create a normalized version of the column for comparison
    // LOWER(REPLACE(REPLACE(REPLACE(column, '-', ' '), '_', ' '), '/', ' '))
    const normalizedColumn = `LOWER(REPLACE(REPLACE(REPLACE(${columnName}, '-', ' '), '_', ' '), '/', ' '))`;

    // Build condition: normalized column LIKE '%word1%word2%...'
    const pattern = `%${words.join('%')}%`;

    return {
        condition: `${normalizedColumn} LIKE ?`,
        params: [pattern],
    };
}

/**
 * Build SQL conditions for fuzzy make matching.
 * Make names are typically simpler (single word), but can still have variations.
 * 
 * @param columnName - The SQL column to match against (e.g., 'brand_name')
 * @param searchValue - The value to search for (e.g., 'Mercedes-Benz')
 * @returns Object with SQL condition string and array of params
 */
export function buildFuzzyMakeCondition(
    columnName: string,
    searchValue: string,
): { condition: string; params: string[] } {
    // Same logic as model matching
    return buildFuzzyModelCondition(columnName, searchValue);
}
