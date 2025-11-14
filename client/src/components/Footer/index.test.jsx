import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './index';

// Mock the iconify component
jest.mock('@iconify/react/dist/iconify.js', () => ({
  Icon: ({ icon, className }) => <div data-testid={`icon-${icon}`} className={className} />
}));

const mockFooterLinks = [
  { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  { id: 'terms', label: 'Terms of Service', href: '/terms' },
  { id: 'support', label: 'Support', href: '/support' }
];

const mockProps = {
  footerLinks: mockFooterLinks,
  onNavigate: jest.fn()
};

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Footer {...mockProps} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(<Footer {...mockProps} />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer {...mockProps} />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('calls onNavigate when footer links are clicked', () => {
    render(<Footer {...mockProps} />);
    const privacyLink = screen.getByText('Privacy Policy');
    fireEvent.click(privacyLink);
    expect(mockProps.onNavigate).toHaveBeenCalledWith('/privacy');
  });

  it('has social media buttons with proper accessibility', () => {
    render(<Footer {...mockProps} />);
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Footer {...mockProps} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
