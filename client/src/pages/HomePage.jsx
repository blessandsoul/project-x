import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Header from '@/components/Header';
import Content from '@/components/Content';
import Footer from '@/components/Footer';
import { mockUser, mockNavigationItems, mockContent, mockFooterLinks } from '@/mocks/_mockData';

const HomePage = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (href) => {
    console.log('Navigate to:', href);
    // TODO-FX: Implement actual navigation logic
  };

  const handleContentAction = (action) => {
    console.log('Content action:', action);
    // TODO-FX: Implement action handlers
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={mockUser}
        navigationItems={mockNavigationItems}
        onNavigate={handleNavigate}
      />

      <Content
        content={mockContent}
        loading={loading}
        onAction={handleContentAction}
      />

      <Footer
        footerLinks={mockFooterLinks}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default HomePage;
