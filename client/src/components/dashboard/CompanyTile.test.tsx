import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { CompanyTile } from './CompanyTile'

const baseCompany = {
  id: 'c1',
  name: 'Test Company',
  logo: 'logo.png',
  description: 'Desc',
  services: [],
  priceRange: { min: 1000, max: 2000, currency: 'USD' },
  rating: 4.25,
  reviewCount: 10,
  vipStatus: false,
  location: { city: 'Tbilisi', state: 'Georgia' },
  contact: { email: 'test@example.com', phone: '123', website: 'https://example.com' },
  establishedYear: 2020,
  reviews: [],
} as const

describe('CompanyTile', () => {
  it('renders company name, city and formatted rating with review count', () => {
    render(<CompanyTile company={baseCompany} />)

    expect(screen.getByText('Test Company')).toBeInTheDocument()
    expect(screen.getByText(/Tbilisi/)).toBeInTheDocument()
    expect(screen.getByText('4.3')).toBeInTheDocument()
    expect(screen.getByText('(10)')).toBeInTheDocument()
  })

  it('shows VIP badge when vipStatus is true', () => {
    render(<CompanyTile company={{ ...baseCompany, vipStatus: true }} />)

    expect(screen.getByText('VIP')).toBeInTheDocument()
  })
})
