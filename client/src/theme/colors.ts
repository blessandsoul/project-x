/**
 * Brand Color System
 * ===================
 * Centralized color palette extracted from the existing UI design.
 * These colors are the single source of truth for the brand identity.
 *
 * Usage: Import and reference these values when applying brand colors.
 * DO NOT hardcode hex values elsewhere - always reference this file.
 *
 * To change brand colors:
 * 1. Update the hex values below
 * 2. The app will automatically use the new colors (CSS vars are injected at runtime)
 */

export const colors = {
  /**
   * Primary Color - Dark Navy Blue
   * Main brand color used for:
   * - Header & Footer backgrounds
   * - Primary buttons
   * - Important text elements
   * - Scrollbar styling
   * - Focus rings
   */
  primary: '#1a2744',

  /**
   * Secondary Color - Light Slate
   * Neutral background color used for:
   * - Card backgrounds
   * - Section backgrounds
   * - Input field backgrounds
   * - Subtle UI surfaces
   */
  secondary: '#f1f5f9',

  /**
   * Accent Color - Golden Orange
   * High-visibility accent color used for:
   * - Call-to-action buttons
   * - Highlights & badges
   * - Hero section accents
   * - Interactive element hover states
   * - Warning/attention indicators
   */
  accent: '#f5a623',
} as const;

/**
 * Type-safe color keys for programmatic access
 */
export type ColorKey = keyof typeof colors;

/**
 * Type-safe color values
 */
export type ColorValue = (typeof colors)[ColorKey];

/**
 * Injects brand colors as CSS custom properties on :root
 * Call this once at app startup (before render)
 */
export function injectBrandColors(): void {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-accent', colors.accent);
}
