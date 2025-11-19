import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'

const mockUseAuth = jest.fn()
const mockUseCompanySearch = jest.fn()
const mockUseFavorites = jest.fn()
const mockUseRecentlyViewed = jest.fn()

jest.mock('@/components/Header/index.tsx', () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}))

jest.mock('@iconify/react/dist/iconify.js', () => ({
  Icon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-testid={`icon-${icon}`} className={className} />
  ),
}))

jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <aside data-testid="app-sidebar" />,
}))

jest.mock('@/components/section-cards', () => ({
  SectionCards: () => <div data-testid="section-cards" />,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    // eslint-disable-next-line react/button-has-type
    <button data-testid="sidebar-trigger" {...props} />
  ),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites(),
}))

jest.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => mockUseRecentlyViewed(),
}))

jest.mock('@/hooks/useCompanySearch', () => ({
  useCompanySearch: () => mockUseCompanySearch(),
}))

jest.mock('@/mocks/_mockData', () => ({
  mockCompanies: [
    {
      id: 'fav1',
      name: 'Favorite Company',
      logo: 'fav-logo.png',
      description: 'Desc',
      services: [],
      priceRange: { min: 1000, max: 2000, currency: 'USD' },
      rating: 4.7,
      reviewCount: 12,
      vipStatus: true,
      location: { city: 'Tbilisi', state: 'Georgia' },
      contact: { email: 'fav@example.com', phone: '123', website: 'https://fav.example' },
      establishedYear: 2018,
      reviews: [],
    },
    {
      id: 'recent1',
      name: 'Recent Company',
      logo: 'recent-logo.png',
      description: 'Desc',
      services: [],
      priceRange: { min: 2000, max: 4000, currency: 'USD' },
      rating: 4.2,
      reviewCount: 8,
      vipStatus: false,
      location: { city: 'Batumi', state: 'Georgia' },
      contact: { email: 'recent@example.com', phone: '456', website: 'https://recent.example' },
      establishedYear: 2015,
      reviews: [],
    },
  ],
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseCompanySearch.mockReset()
    mockUseFavorites.mockReset()
    mockUseRecentlyViewed.mockReset()

    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
      refreshProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteAccount: jest.fn(),
    })

    mockUseCompanySearch.mockReturnValue({
      state: {
        filters: {
          geography: ['Georgia'],
          services: ['Delivery'],
          priceRange: [1000, 5000],
          rating: 4,
          vipOnly: false,
        },
      },
      setFilters: jest.fn(),
      updateFilters: jest.fn(),
      resetFilters: jest.fn(),
    })
  })

  it('shows empty states when there are no favorites or recently viewed companies', () => {
    mockUseFavorites.mockReturnValue({ favorites: [], clearFavorites: jest.fn() })
    mockUseRecentlyViewed.mockReturnValue({ recentlyViewed: [], clearRecentlyViewed: jest.fn() })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/ჯერ არ გაქვთ დამატებული რჩეული კომპანიები/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ჯერ არ გაქვთ ნანახი კომპანიების ისტორია/i),
    ).toBeInTheDocument()
  })

  it('renders quick search section for user role by default', () => {
    mockUseFavorites.mockReturnValue({ favorites: [], clearFavorites: jest.fn() })
    mockUseRecentlyViewed.mockReturnValue({ recentlyViewed: [], clearRecentlyViewed: jest.fn() })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/სწრაფი ძიება კომპანიების მიხედვით/i),
    ).toBeInTheDocument()
  })

  it('renders favorite and recently viewed companies and supports clear actions', () => {
    const clearFavorites = jest.fn()
    const clearRecentlyViewed = jest.fn()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    mockUseFavorites.mockReturnValue({ favorites: ['fav1'], clearFavorites })
    mockUseRecentlyViewed.mockReturnValue({ recentlyViewed: ['recent1'], clearRecentlyViewed })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Favorite Company')).toBeInTheDocument()
    expect(screen.getByText('Recent Company')).toBeInTheDocument()

    const clearButtons = screen.getAllByText('გასუფთავება')
    expect(clearButtons).toHaveLength(2)

    fireEvent.click(clearButtons[0])
    fireEvent.click(clearButtons[1])

    expect(clearFavorites).toHaveBeenCalled()
    expect(clearRecentlyViewed).toHaveBeenCalled()
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    confirmSpy.mockRestore()
  })

  it('sorts companies in user dashboard by rating and by city', () => {
    const clearFavorites = jest.fn()
    const clearRecentlyViewed = jest.fn()

    mockUseFavorites.mockReturnValue({ favorites: ['fav1', 'recent1'], clearFavorites })
    mockUseRecentlyViewed.mockReturnValue({ recentlyViewed: ['fav1', 'recent1'], clearRecentlyViewed })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const region = screen.getByLabelText('User recommended and favorite companies')

    // default sort is by rating (Favorite Company rated higher than Recent Company)
    const favoriteSectionTitle = within(region).getByText('რჩეული კომპანიები')
    const favoriteSection = favoriteSectionTitle.closest('section') ?? favoriteSectionTitle.closest('div')!
    const tilesBefore = within(favoriteSection).getAllByText(/Company$/)
    expect(tilesBefore[0]).toHaveTextContent('Favorite Company')

    const citySortButton = within(region).getByRole('button', { name: 'ქალაქი' })
    fireEvent.click(citySortButton)

    const tilesAfter = within(favoriteSection).getAllByText(/Company$/)
    // Batumi comes before Tbilisi when sorted by city, so Recent Company should now be first
    expect(tilesAfter[0]).toHaveTextContent('Recent Company')
  })
})
