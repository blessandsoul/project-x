import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import CompanySearchPage from './CompanySearchPage'

jest.mock('@iconify/react/dist/iconify.js', () => ({
  Icon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-testid={`icon-${icon}`} className={className} />
  ),
}))

const mockUseCompanySearch = jest.fn()

jest.mock('@/hooks/useCompanySearch', () => ({
  useCompanySearch: () => mockUseCompanySearch(),
}))

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    toggleFavorite: jest.fn(),
    clearFavorites: jest.fn(),
  }),
}))

jest.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    recentlyViewed: [],
    addRecentlyViewed: jest.fn(),
    clearRecentlyViewed: jest.fn(),
  }),
}))

jest.mock('@/mocks/_mockData', () => ({
  mockNavigationItems: [{ id: 'search', label: 'Search', href: '/search' }],
  mockFooterLinks: [],
  mockSearchFilters: {
    geography: ['Georgia'],
    services: ['Full Import Service'],
    priceRange: [1000, 10000] as [number, number],
    rating: 0,
    vipOnly: false,
  },
  mockCompanies: [
    {
      id: '1',
      name: 'Test Auto Import 1',
      logo: 'logo1.png',
      description: 'Desc 1',
      services: ['Full Import Service'],
      priceRange: { min: 2000, max: 5000, currency: 'USD' },
      rating: 4.5,
      reviewCount: 10,
      vipStatus: true,
      location: { city: 'Tbilisi', state: 'Georgia' },
      contact: { email: 'c1@example.com', phone: '123', website: 'https://example.com' },
      establishedYear: 2015,
      reviews: [],
    },
  ],
}))

const defaultFilters = {
  geography: [],
  services: [],
  priceRange: [1000, 10000] as [number, number],
  rating: 0,
  vipOnly: false,
}

const restrictiveFilters = {
  geography: ['Non-existing-state'],
  services: [],
  priceRange: [1000, 10000] as [number, number],
  rating: 5,
  vipOnly: true,
}

describe('CompanySearchPage', () => {
  beforeEach(() => {
    mockUseCompanySearch.mockReset()
  })

  it('renders heading and filters', async () => {
    mockUseCompanySearch.mockReturnValue({
      state: { filters: defaultFilters },
      updateFilters: jest.fn(),
      resetFilters: jest.fn(),
    })

    render(
      <MemoryRouter>
        <CompanySearchPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /მოძებნეთ იმპორტის კომპანიები/i }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Test Auto Import 1')).toBeInTheDocument()
    })
  })

  it('shows empty state when filters exclude all companies', async () => {
    mockUseCompanySearch.mockReturnValue({
      state: { filters: restrictiveFilters },
      updateFilters: jest.fn(),
      resetFilters: jest.fn(),
    })

    render(
      <MemoryRouter>
        <CompanySearchPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('კომპანიები არ მოიძებნა'),
      ).toBeInTheDocument()
    })
  })
})
