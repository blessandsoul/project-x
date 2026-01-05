import { Outlet, useNavigate } from 'react-router-dom';
// Header with Trusted Importers.Ge branding
// CopartHeader.tsx is the old Copart-style variant (deprecated)
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { navigationItems } from '@/config/navigation';

/**
 * MainLayout - Universal layout wrapper for all pages
 * 
 * Features:
 * - Consistent Header across all pages (Trusted Importers.Ge branding)
 * - Consistent Footer across all pages
 * - Proper flex layout for sticky footer
 * - Semantic HTML structure
 * 
 * Usage: Wrap routes in App.tsx with this layout using <Outlet />
 */

interface MainLayoutProps {
  /** Hide footer on specific pages (e.g., fullscreen modals) */
  hideFooter?: boolean;
  /** Hide header on specific pages (e.g., auth pages with custom headers) */
  hideHeader?: boolean;
}

const MainLayout = ({ 
  hideFooter = false,
  hideHeader = false,
}: MainLayoutProps = {}) => {
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Header - Sticky at top */}
      {!hideHeader && (
        <Header 
          navigationItems={navigationItems} 
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Content Area - Grows to fill available space */}
      {/* pt-14 for mobile header (h-14), lg:pt-24 for desktop header (h-14 + h-10 nav bar) */}
      <main className="flex-1 flex flex-col pt-14 lg:pt-24">
        <Outlet />
      </main>

      {/* Footer - Always at bottom */}
      {!hideFooter && (
        <Footer onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default MainLayout;
