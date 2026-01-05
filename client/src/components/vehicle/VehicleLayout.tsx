import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { navigationItems, footerLinks } from '@/config/navigation';

/**
 * @deprecated Use MainLayout instead - this component is kept for backward compatibility
 * VehicleLayout wraps content with Header and Footer
 */
interface VehicleLayoutProps {
  children: ReactNode;
}

const VehicleLayout = ({ children }: VehicleLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header navigationItems={navigationItems} />
      <main className="flex-1 bg-slate-50">{children}</main>
      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default VehicleLayout;
