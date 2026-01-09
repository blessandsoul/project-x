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


### Fixed
- Refined Russian translations for Companies and Auction pages.

### Fixed
- Refined Company Profile translations (Services list, Phone modal).

### Fixed
- Improved Russian translations on Vehicle Details page (Color, Drive, Damage, Fallbacks).
- Improved Russian translations for Login/Auth pages ('Впервые у нас?', 'Войти через').
- Fixed missing 'username' translation on Register page and refined Russian text.
- Refined Russian translations for Profile Settings page to be more professional ('Личные данные', 'Фотография профиля').
- Fixed hardcoded 'Current Bid' and improved Favorite/Watch button translations in Auction list.
- Refined translations for Company Settings page (Shortened titles, fixed hardcoded service names).
- Fixed TypeScript build error in VehicleDetailsPage related to dynamic translation keys.
