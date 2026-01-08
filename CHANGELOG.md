### Fixed
- Fixed critical crash on Catalog page caused by empty values in Shipping Calculator dropdowns.
- Updated Content Security Policy (CSP) to allow external media sources (fixing Copart video loading).
- Fixed Dialog animation centering issue in `client/src/index.css`
- Fixed localization text in `client/src/pages/CompanyCatalogPage.tsx`
- Fixed "Invalid hook call" error by moving i18n dependencies to client package and configuring Vite dedupe.
### Added
- Implemented full i18n support with 4 languages (KA, EN, RU, AR) and RTL support.
### Changed
- Refactored `TestimonialsSection` and `MiniBlogSection` with modern UI, hover effects, and removed coming-soon overlay.
### Added
- Added Social Auth buttons (Google, Facebook) to Login and Register pages.

### Fixed
- Migrated local database to production and resolved VPS connection issues.
- Fixed CSP (Content Security Policy) to allow Google Fonts in production.
- Resolved MySQL port mapping conflict (3307).
- Fixed CORS origin environment variable name.
- Fixed Coolify deployment CSP errors (stylesheets, fonts, inline scripts).
- Fixed X-Frame-Options header conflict by disabling frameguard in Helmet.
- Enhanced CSP directives for production (WebSocket, Google Fonts, blob URLs).
### Added
- Created comprehensive Coolify deployment guide (COOLIFY_DEPLOYMENT_GUIDE.md).

