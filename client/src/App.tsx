import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import DashboardPage from './pages/DashboardPage'
import CompanySearchPage from './pages/CompanySearchPage'
import CompanyCatalogPage from './pages/CompanyCatalogPage'
import CompanyProfilePage from './pages/CompanyProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { RequireAuth, RequireGuest } from '@/app/RequireAuth'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={(
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          )}
        />
        <Route
          path="/register"
          element={(
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          )}
        />
        <Route path="/search" element={<CompanySearchPage />} />
        <Route path="/catalog" element={<CompanyCatalogPage />} />
        <Route path="/company/:id" element={<CompanyProfilePage />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          )}
        />
      </Routes>
    </Router>
  )
}

export default App
