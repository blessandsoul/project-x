import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';
import { HomePageContent } from '@/components/home/HomePageContent';
import { useHomePageState } from '@/hooks/useHomePageState';
import { navigationItems, footerLinks } from '@/config/navigation';

const HomePage = () => {
  // Simulate loading state
  const { loading } = useHomePageState();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        navigationItems={navigationItems}
      />

      {loading ? <HomePageSkeleton /> : <HomePageContent />}

      <Footer
        footerLinks={footerLinks}
      />
    </div>
  );
};

export default HomePage;
