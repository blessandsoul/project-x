import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { injectBrandColors } from '@/theme/colors'
import './index.css'

import './lib/i18n'
import App from './App.tsx'
import { AuthProvider } from '@/hooks/useAuth'
import { SearchProvider } from '@/hooks/useCompanySearch'
import { FavoritesProvider } from '@/hooks/useFavorites'
import { RecentlyViewedProvider } from '@/hooks/useRecentlyViewed'
import { Toaster } from '@/components/ui/sonner'

// Inject brand colors as CSS variables before render
injectBrandColors()

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[GlobalError] Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[GlobalError] Unhandled promise rejection', {
      reason: event.reason,
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FavoritesProvider>
        <RecentlyViewedProvider>
          <SearchProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </SearchProvider>
        </RecentlyViewedProvider>
      </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
