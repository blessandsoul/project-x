import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/page-loader'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth()
  const location = useLocation()

  // Show loading state while auth initializes (prevents flicker)
  if (!isInitialized) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth()

  // Show loading state while auth initializes (prevents flicker)
  if (!isInitialized) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * Route guard for company onboarding page
 *
 * Requirements:
 * - User must be authenticated
 * - User must NOT already have a company (company_id === null)
 *
 * If user already has a company, redirect to their company page.
 */
export function RequireNoCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized, companyId } = useAuth()
  const location = useLocation()

  // Show loading state while auth initializes (prevents flicker)
  if (!isInitialized) {
    return <PageLoader />
  }

  // Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user already has a company, redirect to company page
  if (companyId !== null && companyId !== undefined) {
    return <Navigate to={`/company/${companyId}`} replace />
  }

  return <>{children}</>
}
