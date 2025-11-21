import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, userRole } = useAuth()

  if (isAuthenticated) {
    let target = '/onboarding/user'
    if (userRole === 'dealer') {
      target = '/onboarding/dealer'
    } else if (userRole === 'company') {
      target = '/onboarding/company'
    }

    return <Navigate to={target} replace />
  }

  return <>{children}</>
}
