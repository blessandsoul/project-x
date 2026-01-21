import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import CompanyCatalogPage from './CompanyCatalogPage'

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
  mockCompanies: [
    {
      id: '1',
      name: 'Test Auto Import 1',
      logo: 'logo1.png',
      description: 'Desc 1',
      services: ['Full Import Service'],
      priceRange: { min: 2000, max: 5000, currency: 'USD' },
      rating: 9.0,
      reviewCount: 10,
      vipStatus: true,
      location: { city: 'Tbilisi', state: 'Georgia' },
      contact: { email: 'c1@example.com', phone: '123', website: 'https://example.com' },
      establishedYear: 2015,
      reviews: [],
    },
    {
      id: '2',
      name: 'Budget Cars 2',
      logo: 'logo2.png',
      description: 'Desc 2',
      services: ['Shipping'],
      priceRange: { min: 1500, max: 3000, currency: 'USD' },
      rating: 7.6,
      reviewCount: 5,
      vipStatus: false,
      location: { city: 'Batumi', state: 'Georgia' },
      contact: { email: 'c2@example.com', phone: '456', website: 'https://example.org' },
      establishedYear: 2012,
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

describe('CompanyCatalogPage', () => {
  beforeEach(() => {
    mockUseCompanySearch.mockReset()
    mockUseCompanySearch.mockReturnValue({
      state: { filters: defaultFilters },
    })
  })

  it('renders heading and search input', async () => {
    render(
      <MemoryRouter>
        <CompanyCatalogPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /კატალოგი იმპორტის კომპანიების/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByPlaceholderText('მოძებნეთ კომპანიები...'),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Test Auto Import 1')).toBeInTheDocument()
    })
  })

  it('shows empty state when no companies match search', async () => {
    render(
      <MemoryRouter>
        <CompanyCatalogPage />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('მოძებნეთ კომპანიები...')
    fireEvent.change(input, { target: { value: 'no-such-company' } })

    await waitFor(() => {
      expect(
        screen.getByText('კომპანიები არ მოიძებნა'),
      ).toBeInTheDocument()
    })
  })
})
