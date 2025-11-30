import Header from '@/components/Header/index.tsx';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';
import { HomePageContent } from '@/components/home/HomePageContent';
import { useHomePageState } from '@/hooks/useHomePageState';
import { navigationItems } from '@/config/navigation';

const HomePage = () => {
  // Simulate loading state
  const { loading } = useHomePageState();

  return (
    <div className="min-h-screen flex flex-col">
      <Header navigationItems={navigationItems} />

      {loading ? (
        <HomePageSkeleton />
      ) : (
        <HomePageContent />
      )}
    </div>
  );
};

export default HomePage;
