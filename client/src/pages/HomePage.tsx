import Header from '@/components/Header/index.tsx';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';
import { HomePageContent } from '@/components/home/HomePageContent';
import { useHomePageState } from '@/hooks/useHomePageState';
import { navigationItems } from '@/config/navigation';

const HomePage = () => {
  // Simulate loading state
  const { loading } = useHomePageState();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1F1F1F]">
      <Header navigationItems={navigationItems} variant="hero" />

      {loading ? (
        <HomePageSkeleton />
      ) : (
        <HomePageContent />
      )}
    </div>
  );
};

export default HomePage;
