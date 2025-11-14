import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickSearchSection } from '@/components/home/QuickSearchSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturedCompaniesSection } from '@/components/home/FeaturedCompaniesSection';
import { CarCasesSection } from '@/components/home/CarCasesSection';
import { BrandLogosSection } from '@/components/home/BrandLogosSection';
import { BenefitsSection } from '@/components/home/BenefitsSection';
import { TrustSection } from '@/components/home/TrustSection';
import { CompanyCompareSection } from '@/components/home/CompanyCompareSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FAQSection } from '@/components/home/FAQSection';
import { MiniBlogSection } from '@/components/home/MiniBlogSection';
import { FinalCTASection } from '@/components/home/FinalCTASection';
import { MobileStickyCta } from '@/components/home/MobileStickyCta';
import { mockUser, mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';

const HomePage = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={mockUser}
        navigationItems={mockNavigationItems}
      />

      {loading ? (
        <main className="flex-1 flex items-center justify-center" role="main">
          <p className="text-sm text-muted-foreground">
            იტვირთება მთავარი გვერდი...
          </p>
        </main>
      ) : (
        <main className="flex-1" role="main">
          <HeroSection />
          <QuickSearchSection />
          <HowItWorksSection />
          <FeaturedCompaniesSection />
          <CarCasesSection />
          <BrandLogosSection />
          <BenefitsSection />
          <TrustSection />
          <CompanyCompareSection />
          <TestimonialsSection />
          <FAQSection />
          <MiniBlogSection />
          <FinalCTASection />
        </main>
      )}

      <Footer
        footerLinks={mockFooterLinks}
      />
      <MobileStickyCta />
    </div>
  );
};

export default HomePage;
