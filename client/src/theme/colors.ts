/**
 * Design Token System
 * ====================
 * Single source of truth for the green/glass design direction.
 * All colors are semantic tokens organized by purpose.
 *
 * Usage: Import `colors` object or use CSS variables injected by `injectBrandColors()`.
 * DO NOT hardcode hex values elsewhere - always reference this file.
 *
 * Token Structure:
 * - brand: Core brand identity colors
 * - gradient: Hero and background gradients
 * - glass: Translucent glassmorphism surfaces
 * - header: Header-specific glass styling
 * - text: Typography colors
 * - bg: Background colors for pages/sections
 */

export const colors = {
  /**
   * Brand Colors
   * Core identity colors for CTAs, highlights, and brand elements
   */
  brand: {
    /** Golden orange - CTAs, badges, highlights, interactive hover states */
    accent: '#f5a623',
  },

  /**
   * Gradient Colors
   * Used for hero sections and immersive backgrounds
   */
  gradient: {
    hero: {
      /** Start color - Deep teal */
      start: '#0d4a4a',
      /** Middle color - Rich emerald */
      mid: '#0f5f4c',
      /** End color - Darker forest green */
      end: '#0a3d3d',
    },
  },

  /**
   * Glass Effect Colors
   * Translucent surfaces for cards, panels, and overlays
   */
  glass: {
    /** Glass surface background */
    surface: 'rgba(255, 255, 255, 0.08)',
    /** Glass surface on hover */
    surfaceHover: 'rgba(255, 255, 255, 0.12)',
    /** Glass border */
    border: 'rgba(255, 255, 255, 0.15)',
    /** Glass border on hover */
    borderHover: 'rgba(255, 255, 255, 0.25)',
    /** Glass shadow */
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  /**
   * Header Colors
   * Glassmorphism styling for the fixed header
   */
  header: {
    /** Header background - emerald tinted glass (home page, not scrolled) */
    bg: 'rgba(13, 74, 74, 0.75)',
    /** Header background when scrolled on home page - solid dark green */
    bgScrolled: 'rgba(13, 74, 74, 0.95)',
    /** Header border */
    border: 'rgba(255, 255, 255, 0.1)',
    /** Header shadow */
    shadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
    /** Nav item hover background */
    navHover: 'rgba(255, 255, 255, 0.1)',
    /** Nav item active background */
    navActive: 'rgba(255, 255, 255, 0.18)',
    /** Nav item active border */
    navActiveBorder: 'rgba(255, 255, 255, 0.25)',
  },

  /**
   * Header Colors (Navy) - For non-home pages
   * Navy blue styling matching the deprecated primary color
   */
  headerNavy: {
    /** Header background - navy blue glass */
    bg: 'rgba(26, 39, 68, 0.85)',
    /** Header background when scrolled - solid navy */
    bgScrolled: 'rgba(26, 39, 68, 0.95)',
    /** Header border */
    border: 'rgba(255, 255, 255, 0.1)',
    /** Header shadow */
    shadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
    /** Nav item hover background */
    navHover: 'rgba(255, 255, 255, 0.1)',
    /** Nav item active background */
    navActive: 'rgba(255, 255, 255, 0.18)',
    /** Nav item active border */
    navActiveBorder: 'rgba(255, 255, 255, 0.25)',
  },

  /**
   * Text Colors
   * Typography colors for various contexts
   */
  text: {
    /** Primary text on light backgrounds */
    primary: '#1a2744',
    /** Muted/secondary text */
    muted: '#64748b',
    /** Text on dark/colored backgrounds (inverse) */
    inverse: '#ffffff',
  },

  /**
   * Background Colors
   * Page and section backgrounds
   */
  bg: {
    /** Main page background */
    page: '#ffffff',
    /** Elevated section background (cards, sidebars) */
    section: '#f1f5f9',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY ALIASES - For backwards compatibility during migration
  // These map old token names to new semantic values. Remove after full migration.
  // ═══════════════════════════════════════════════════════════════════════════

  /** @deprecated Use colors.text.primary or colors.gradient.hero.start */
  primary: '#1a2744',
  /** @deprecated Use colors.bg.section */
  secondary: '#f1f5f9',
  /** @deprecated Use colors.brand.accent */
  accent: '#f5a623',
  /** @deprecated Use colors.gradient.hero */
  heroGradient: {
    start: '#0d4a4a',
    mid: '#0f5f4c',
    end: '#0a3d3d',
  },
  /** @deprecated Use colors.header */
  headerGlass: {
    bg: 'rgba(13, 74, 74, 0.75)',
    bgScrolled: 'rgba(13, 74, 74, 0.95)',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
    navHover: 'rgba(255, 255, 255, 0.1)',
    navActive: 'rgba(255, 255, 255, 0.18)',
    navActiveBorder: 'rgba(255, 255, 255, 0.25)',
  },
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
 * Injects design tokens as CSS custom properties on :root
 * Call this once at app startup (before render)
 */
export function injectBrandColors(): void {
  const root = document.documentElement;

  // ─────────────────────────────────────────────────────────────────────────
  // NEW SEMANTIC TOKENS
  // ─────────────────────────────────────────────────────────────────────────

  // Brand
  root.style.setProperty('--brand-accent', colors.brand.accent);

  // Gradient - Hero
  root.style.setProperty('--gradient-hero-start', colors.gradient.hero.start);
  root.style.setProperty('--gradient-hero-mid', colors.gradient.hero.mid);
  root.style.setProperty('--gradient-hero-end', colors.gradient.hero.end);

  // Glass
  root.style.setProperty('--glass-surface', colors.glass.surface);
  root.style.setProperty('--glass-surface-hover', colors.glass.surfaceHover);
  root.style.setProperty('--glass-border', colors.glass.border);
  root.style.setProperty('--glass-border-hover', colors.glass.borderHover);
  root.style.setProperty('--glass-shadow', colors.glass.shadow);

  // Header
  root.style.setProperty('--header-bg', colors.header.bg);
  root.style.setProperty('--header-bg-scrolled', colors.header.bgScrolled);
  root.style.setProperty('--header-border', colors.header.border);
  root.style.setProperty('--header-shadow', colors.header.shadow);
  root.style.setProperty('--header-nav-hover', colors.header.navHover);
  root.style.setProperty('--header-nav-active', colors.header.navActive);
  root.style.setProperty('--header-nav-active-border', colors.header.navActiveBorder);

  // Text
  root.style.setProperty('--text-primary', colors.text.primary);
  root.style.setProperty('--text-muted', colors.text.muted);
  root.style.setProperty('--text-inverse', colors.text.inverse);

  // Background
  root.style.setProperty('--bg-page', colors.bg.page);
  root.style.setProperty('--bg-section', colors.bg.section);

  // ─────────────────────────────────────────────────────────────────────────
  // LEGACY ALIASES - Keep for backwards compatibility until migration complete
  // ─────────────────────────────────────────────────────────────────────────

  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-secondary', colors.secondary);
  // --brand-accent already set above (same value)

  // Legacy hero gradient vars (used by existing components)
  root.style.setProperty('--hero-gradient-start', colors.gradient.hero.start);
  root.style.setProperty('--hero-gradient-mid', colors.gradient.hero.mid);
  root.style.setProperty('--hero-gradient-end', colors.gradient.hero.end);

  // Legacy header glass vars (used by Header component)
  root.style.setProperty('--header-glass-bg', colors.header.bg);
  root.style.setProperty('--header-glass-bg-scrolled', colors.header.bgScrolled);
  root.style.setProperty('--header-glass-border', colors.header.border);
  root.style.setProperty('--header-glass-shadow', colors.header.shadow);
}
