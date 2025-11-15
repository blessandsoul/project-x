import { useEffect, type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import HomePage from './pages/HomePage.tsx'
import DashboardPage from './pages/DashboardPage'
import CompanySearchPage from './pages/CompanySearchPage'
import CompanyCatalogPage from './pages/CompanyCatalogPage'
import CompanyProfilePage from './pages/CompanyProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LogisticsRadarPage from './pages/LogisticsRadarPage'
import AuctionListingsPage from './pages/AuctionListingsPage'
import CarfaxPage from './pages/CarfaxPage'
import ProfilePage from './pages/ProfilePage'
import { RequireAuth, RequireGuest } from '@/app/RequireAuth'
import VehicleDetailsPage from './pages/VehicleDetailsPage'

function ScrollToTop() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (typeof window === 'undefined') return

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

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={renderWithTransition(<HomePage />)} />
          <Route
            path="/login"
            element={renderWithTransition(
              <RequireGuest>
                <LoginPage />
              </RequireGuest>,
            )}
          />
          <Route
            path="/register"
            element={renderWithTransition(
              <RequireGuest>
                <RegisterPage />
              </RequireGuest>,
            )}
          />
          <Route
            path="/search"
            element={renderWithTransition(<CompanySearchPage />)}
          />
          <Route
            path="/catalog"
            element={renderWithTransition(<CompanyCatalogPage />)}
          />
          <Route
            path="/company/:id"
            element={renderWithTransition(<CompanyProfilePage />)}
          />
          <Route
            path="/dashboard"
            element={renderWithTransition(
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>,
            )}
          />
          <Route
            path="/profile"
            element={renderWithTransition(
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>,
            )}
          />
          <Route
            path="/logistics-radar"
            element={renderWithTransition(<LogisticsRadarPage />)}
          />
          <Route
            path="/auction-listings"
            element={renderWithTransition(<AuctionListingsPage />)}
          />
          <Route
            path="/vin"
            element={renderWithTransition(<CarfaxPage />)}
          />
          <Route
            path="/vehicle/:id"
            element={renderWithTransition(<VehicleDetailsPage />)}
          />
        </Routes>
      </AnimatePresence>
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
