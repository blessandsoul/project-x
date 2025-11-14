import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from './HomePage';

// Mock the components
jest.mock('../components/Header', () => {
  return function MockHeader(props) {
    return <header data-testid="header" {...props} />;
  };
});

jest.mock('../components/Content', () => {
  return function MockContent(props) {
    return <main data-testid="content" {...props} />;
  };
});

jest.mock('../components/Footer', () => {
  return function MockFooter(props) {
    return <footer data-testid="footer" {...props} />;
  };
});

// Mock the mock data
jest.mock('../mocks/_mockData', () => ({
  mockUser: { id: '1', name: 'John Doe' },
  mockNavigationItems: [{ id: 'home', label: 'Home', href: '/' }],
  mockContent: { title: 'Test Title' },
  mockFooterLinks: [{ id: 'privacy', label: 'Privacy', href: '/privacy' }]
}));

describe('HomePage', () => {
  it('renders all components', async () => {
    render(<HomePage />);

    // Initially shows loading state
    expect(screen.getByTestId('content')).toBeInTheDocument();

    // After loading completes
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  it('has proper layout structure', async () => {
    render(<HomePage />);

    await waitFor(() => {
      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('min-h-screen', 'flex', 'flex-col');
    });
  });
});
