import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { AuthProvider } from '@/hooks/useAuth'
import { SearchProvider } from '@/hooks/useCompanySearch'
import { FavoritesProvider } from '@/hooks/useFavorites'
import { RecentlyViewedProvider } from '@/hooks/useRecentlyViewed'

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
          </SearchProvider>
        </RecentlyViewedProvider>
      </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
