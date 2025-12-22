/**
 * Locale-aware date formatting utility.
 * Handles Georgian (ka) specially since Intl.DateTimeFormat doesn't reliably support it in all browsers.
 */

const MONTH_SHORT_KA = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];

export type DateFormatOptions = {
  month?: 'short' | 'long' | 'numeric';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  hour12?: boolean;
};

/**
 * Normalize language code to a valid Intl locale.
 * Maps 'ge' -> 'ka', strips region codes.
 */
export function normalizeLocale(lang: string | undefined): string {
  if (!lang) return 'en';
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'ge') return 'ka';
  return base;
}

/**
 * Check if the given locale is Georgian.
 */
export function isGeorgianLocale(lang: string | undefined): boolean {
  const normalized = normalizeLocale(lang);
  return normalized === 'ka';
}

/**
 * Format a date according to the given locale.
 * For Georgian, uses manual month names since Intl support is unreliable.
 */
export function formatDate(
  date: Date | string | number,
  lang: string | undefined,
  options: DateFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const locale = normalizeLocale(lang);
  const isKa = locale === 'ka';

  // For Georgian, manually format since Intl doesn't reliably support it
  if (isKa) {
    const parts: string[] = [];

    if (options.month) {
      const monthIdx = d.getMonth();
      parts.push(MONTH_SHORT_KA[monthIdx]);
    }

    if (options.day) {
      parts.push(String(d.getDate()));
    }

    if (options.year) {
      parts.push(String(d.getFullYear()));
    }

    let result = parts.join(' ');

    // Add time if requested
    if (options.hour !== undefined || options.minute !== undefined) {
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');

      const separator = result.length > 0 ? ', ' : '';

      if (options.hour12) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        result += `${separator}${hour12}:${minutes} ${ampm}`;
      } else {
        result += `${separator}${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    return result;
  }

  // For other locales, use Intl.DateTimeFormat
  try {
    return new Intl.DateTimeFormat(locale, options as Intl.DateTimeFormatOptions).format(d);
  } catch {
    // Fallback to en if locale not supported
    return new Intl.DateTimeFormat('en', options as Intl.DateTimeFormatOptions).format(d);
  }
}

/**
 * Format time only.
 */
export function formatTime(
  date: Date | string | number,
  lang: string | undefined,
  hour12 = true
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const locale = normalizeLocale(lang);
  const isKa = locale === 'ka';

  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');

  if (isKa || hour12) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12Val = hours % 12 || 12;
    return `${hour12Val}:${minutes} ${ampm}`;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
}

/**
 * Format date and time together.
 */
export function formatDateTime(
  date: Date | string | number,
  lang: string | undefined,
  options: DateFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
): string {
  return formatDate(date, lang, options);
}
