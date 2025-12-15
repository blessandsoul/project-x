/**
 * SQL Sanitization Utilities
 *
 * Provides functions to sanitize user input for safe use in SQL queries.
 * These are defense-in-depth measures - parameterized queries are the primary protection.
 */

/**
 * Escape special characters in LIKE patterns to prevent pattern injection.
 * The % and _ characters have special meaning in SQL LIKE clauses.
 *
 * @param input - User input string
 * @returns Escaped string safe for use in LIKE patterns
 *
 * @example
 * // User searches for "100%"
 * const pattern = `%${escapeLikePattern(userInput)}%`;
 * // Results in: %100\%% (the % in user input is escaped)
 */
export function escapeLikePattern(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/%/g, '\\%')   // Escape percent signs
    .replace(/_/g, '\\_');  // Escape underscores
}

/**
 * Sanitize a string for safe use in SQL queries.
 * Removes null bytes and trims whitespace.
 *
 * @param input - User input string
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\0/g, '')     // Remove null bytes
    .trim()
    .slice(0, maxLength);   // Enforce max length
}

/**
 * Validate and sanitize an integer ID.
 * Returns null if the input is not a valid positive integer.
 *
 * @param input - User input (string or number)
 * @returns Valid positive integer or null
 */
export function sanitizeId(input: unknown): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const num = typeof input === 'string' ? parseInt(input, 10) : Number(input);

  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return null;
  }

  // Prevent integer overflow attacks
  if (num > Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return num;
}

/**
 * Validate that a value is one of the allowed options.
 * Useful for ORDER BY columns, enum fields, etc.
 *
 * @param input - User input
 * @param allowed - Array of allowed values
 * @param defaultValue - Default value if input is invalid
 * @returns Valid value or default
 */
export function validateEnum<T extends string>(
  input: unknown,
  allowed: readonly T[],
  defaultValue: T,
): T {
  if (typeof input !== 'string') {
    return defaultValue;
  }

  const normalized = input.toLowerCase().trim() as T;
  return allowed.includes(normalized) ? normalized : defaultValue;
}

/**
 * Strict URL validation for social links and other user-provided URLs.
 *
 * Security checks:
 * 1. Must be a valid absolute URL (parseable by URL constructor)
 * 2. Protocol must be http: or https: (no javascript:, data:, file:, blob:)
 * 3. No embedded credentials (username:password in URL)
 * 4. No whitespace
 * 5. Max length enforced
 *
 * @param url - User-provided URL string
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Normalized URL string
 * @throws Error if URL is invalid or fails security checks
 */
export function validateAndNormalizeSocialUrl(url: string, maxLength = 500): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required');
  }

  // Trim whitespace
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    throw new Error('URL is required');
  }

  // Check for whitespace in URL (after trimming ends)
  if (/\s/.test(trimmed)) {
    throw new Error('URL must not contain whitespace');
  }

  // Check max length
  if (trimmed.length > maxLength) {
    throw new Error(`URL must not exceed ${maxLength} characters`);
  }

  // Parse URL - this validates it's a well-formed URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Check protocol (only http/https allowed)
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error('URL must use http or https protocol');
  }

  // Check for embedded credentials (security risk)
  if (parsed.username || parsed.password) {
    throw new Error('URL must not contain embedded credentials');
  }

  // Return the normalized URL (href includes trailing slash normalization, etc.)
  return parsed.href;
}
