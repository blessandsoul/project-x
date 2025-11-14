import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Content from './index';

// Mock the iconify component
jest.mock('@iconify/react/dist/iconify.js', () => ({
  Icon: ({ icon, className }) => <div data-testid={`icon-${icon}`} className={className} />
}));

const mockContent = {
  title: 'Welcome to Our Platform',
  subtitle: 'Build amazing things with modern web technologies',
  description: 'This is a sample content area that demonstrates the layout structure.',
  features: [
    {
      id: '1',
      title: 'Fast Development',
      description: 'Rapid prototyping with modern React and TypeScript'
    },
    {
      id: '2',
      title: 'Beautiful UI',
      description: 'Clean, accessible components with shadcn/ui'
    }
  ]
};

const mockProps = {
  content: mockContent,
  loading: false,
  onAction: jest.fn()
};

describe('Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Content {...mockProps} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays content title and description', () => {
    render(<Content {...mockProps} />);
    expect(screen.getByText('Welcome to Our Platform')).toBeInTheDocument();
    expect(screen.getByText('Build amazing things with modern web technologies')).toBeInTheDocument();
  });

  it('renders all features', () => {
    render(<Content {...mockProps} />);
    expect(screen.getByText('Fast Development')).toBeInTheDocument();
    expect(screen.getByText('Beautiful UI')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    render(<Content {...mockProps} loading={true} />);
    // Check for skeleton elements (they have animate-pulse class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onAction when buttons are clicked', () => {
    render(<Content {...mockProps} />);
    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);
    expect(mockProps.onAction).toHaveBeenCalledWith('get-started');

    const learnMoreButton = screen.getByText('Learn More');
    fireEvent.click(learnMoreButton);
    expect(mockProps.onAction).toHaveBeenCalledWith('learn-more');

    const signUpButton = screen.getByText('Sign Up Now');
    fireEvent.click(signUpButton);
    expect(mockProps.onAction).toHaveBeenCalledWith('sign-up');
  });

  it('has proper accessibility attributes', () => {
    render(<Content {...mockProps} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
