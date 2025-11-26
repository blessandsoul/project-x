import { useEffect, useRef, type ReactNode, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MobileStickyCta } from '@/components/home/MobileStickyCta'
import { PageLoader } from '@/components/ui/page-loader'
import HomePage from './pages/HomePage.tsx'
import { RequireAuth, RequireGuest } from '@/app/RequireAuth'

// Lazy load pages for better performance (Code Splitting)
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CompanyCatalogPage = lazy(() => import('./pages/CompanyCatalogPage'))
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AuctionListingsPage = lazy(() => import('./pages/AuctionListingsPage'))
const CarfaxPage = lazy(() => import('./pages/CarfaxPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const VehicleDetailsPage = lazy(() => import('./pages/VehicleDetailsPage'))

function ScrollToTop() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }, [location.pathname, shouldReduceMotion])

  return null
}

function AppRoutes() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  const defaultPageMotionProps = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  } as const

  const reducedPageMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as const

  const pageMotionProps = shouldReduceMotion
    ? reducedPageMotionProps
    : defaultPageMotionProps

  const renderWithTransition = (children: ReactNode) => (
    <motion.div
      {...pageMotionProps}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )

  // Helper to wrap lazy components with Suspense and Transition
  const LazyRoute = ({ children }: { children: ReactNode }) => (
    <Suspense fallback={<PageLoader />}>
      {renderWithTransition(children)}
    </Suspense>
  )

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* HomePage loaded eagerly for LCP */}
          <Route path="/" element={renderWithTransition(<HomePage />)} />
          
          <Route
            path="/login"
            element={
              <RequireGuest>
                <LazyRoute><LoginPage /></LazyRoute>
              </RequireGuest>
            }
          />
          <Route
            path="/register"
            element={
              <RequireGuest>
                <LazyRoute><RegisterPage /></LazyRoute>
              </RequireGuest>
            }
          />
          <Route
            path="/catalog"
            element={<LazyRoute><CompanyCatalogPage /></LazyRoute>}
          />
          <Route
            path="/companies"
            element={<LazyRoute><CompanyCatalogPage /></LazyRoute>}
          />
          <Route
            path="/company/:id"
            element={<LazyRoute><CompanyProfilePage /></LazyRoute>}
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <LazyRoute><DashboardPage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <LazyRoute><ProfilePage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <LazyRoute><OnboardingPage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding/user"
            element={
              <RequireAuth>
                <LazyRoute><OnboardingPage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding/dealer"
            element={
              <RequireAuth>
                <LazyRoute><OnboardingPage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding/company"
            element={
              <RequireAuth>
                <LazyRoute><OnboardingPage /></LazyRoute>
              </RequireAuth>
            }
          />
          <Route
            path="/auction-listings"
            element={<LazyRoute><AuctionListingsPage /></LazyRoute>}
          />
          <Route
            path="/vin"
            element={<LazyRoute><CarfaxPage /></LazyRoute>}
          />
          <Route
            path="/vehicle/:id"
            element={<LazyRoute><VehicleDetailsPage /></LazyRoute>}
          />
        </Routes>
      </AnimatePresence>
      <MobileStickyCta />
    </>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
