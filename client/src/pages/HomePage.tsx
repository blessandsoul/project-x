import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { MobileStickyCta } from '@/components/home/MobileStickyCta';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';
import { HomePageContent } from '@/components/home/HomePageContent';
import { useHomePageState } from '@/hooks/useHomePageState';
import { mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';

const HomePage = () => {
  // Simulate loading state
  const { loading, isStickyCtaVisible } = useHomePageState();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        navigationItems={mockNavigationItems}
      />

      {loading ? <HomePageSkeleton /> : <HomePageContent />}

      <Footer
        footerLinks={mockFooterLinks}
      />
      {isStickyCtaVisible && <MobileStickyCta />}
    </div>
  );
};

export default HomePage;
