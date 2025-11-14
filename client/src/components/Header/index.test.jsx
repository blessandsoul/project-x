import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './index';

// Mock the iconify component
jest.mock('@iconify/react/dist/iconify.js', () => ({
  Icon: ({ icon, className }) => <div data-testid={`icon-${icon}`} className={className} />
}));

const mockProps = {
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
  },
  navigationItems: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' }
  ],
  onNavigate: jest.fn()
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('displays user information when user is provided', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('User avatar')).toBeInTheDocument();
  });

  it('displays sign in button when no user is provided', () => {
    render(<Header {...mockProps} user={null} />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('calls onNavigate when navigation items are clicked', () => {
    render(<Header {...mockProps} />);
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    expect(mockProps.onNavigate).toHaveBeenCalledWith('/');
  });

  it('renders navigation items', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
