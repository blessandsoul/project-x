import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';
import { HomePageContent } from '@/components/home/HomePageContent';
import { useHomePageState } from '@/hooks/useHomePageState';

/**
 * HomePage - Landing page with hero section
 * 
 * Header and Footer are provided by MainLayout automatically.
 * This component only renders the page-specific content.
 */
const HomePage = () => {
  const { loading } = useHomePageState();

  return (
    <div className="flex-1 flex flex-col">
      {loading ? (
        <HomePageSkeleton />
      ) : (
        <HomePageContent />
      )}
    </div>
  );
};

export default HomePage;
