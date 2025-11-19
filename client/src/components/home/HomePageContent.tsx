import { Suspense, lazy } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { LeadCaptureSection } from '@/components/home/LeadCaptureSection'
import { QuickSearchSection } from '@/components/home/QuickSearchSection'
import { PriceCalculatorSection } from '@/components/home/PriceCalculatorSection'
import { AudienceSegmentationSection } from '@/components/home/AudienceSegmentationSection'
import { ReadyScenariosSection } from '@/components/home/ReadyScenariosSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { FeaturedCompaniesSection } from '@/components/home/FeaturedCompaniesSection'
import { CarCasesSection } from '@/components/home/CarCasesSection'
import { BrandLogosSection } from '@/components/home/BrandLogosSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { TrustSection } from '@/components/home/TrustSection'
import { FinalCTASection } from '@/components/home/FinalCTASection'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/company/EmptyState'
import { useCompaniesData } from '@/hooks/useCompaniesData'
import { useCompanyStats } from '@/hooks/useCompanyStats'

const CompanyCompareSectionLazy = lazy(() =>
  import('@/components/home/CompanyCompareSection').then((mod) => ({
    default: mod.CompanyCompareSection,
  })),
)

const TestimonialsSectionLazy = lazy(() =>
  import('@/components/home/TestimonialsSection').then((mod) => ({
    default: mod.TestimonialsSection,
  })),
)

const FAQSectionLazy = lazy(() =>
  import('@/components/home/FAQSection').then((mod) => ({
    default: mod.FAQSection,
  })),
)

const MiniBlogSectionLazy = lazy(() =>
  import('@/components/home/MiniBlogSection').then((mod) => ({
    default: mod.MiniBlogSection,
  })),
)

export const HomePageContent = () => {
  const { companies, isLoading: isCompaniesLoading, error: companiesError } = useCompaniesData()
  const stats = useCompanyStats(companies)

  return (
    <main className="flex-1" role="main" aria-labelledby="home-hero-heading">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Hero & lead capture */}
        <HeroSection stats={stats} companies={companies} />
        <LeadCaptureSection />

        {/* Block 1: Find a company */}
        <div className="mt-10 mb-6 border-t border-muted/40 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ნაბიჯი 1 — მოიძიე სანდო კომპანია
          </h2>
        </div>
        <QuickSearchSection />
        <PriceCalculatorSection />
        <AudienceSegmentationSection />
        <ReadyScenariosSection />

        {/* Block 2: Why users trust the platform */}
        <div className="mt-10 mb-6 border-t border-muted/40 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ნაბიჯი 2 — რატომ გვენდობა მომხმარებლებს
          </h2>
        </div>
        <HowItWorksSection />
        <FeaturedCompaniesSection
          companies={companies}
          isLoading={isCompaniesLoading}
        />
        <BrandLogosSection />
        <BenefitsSection />
        <TrustSection />
        <Suspense fallback={null}>
          <CompanyCompareSectionLazy
            companies={companies}
            isLoading={isCompaniesLoading}
            error={companiesError}
          />
        </Suspense>

        {/* Block 3: Stories & learning */}
        <div className="mt-10 mb-6 border-t border-muted/40 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ნაბიჯი 3 — ისტორიები და ცოდნა
          </h2>
        </div>
        <CarCasesSection />
        <Suspense fallback={null}>
          <TestimonialsSectionLazy />
        </Suspense>
        <Suspense fallback={null}>
          <FAQSectionLazy />
        </Suspense>
        <Suspense fallback={null}>
          <MiniBlogSectionLazy />
        </Suspense>

        {/* Block 4: Final CTA */}
        <div className="mt-10 mb-6 border-t border-muted/40 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ნაბიჯი 4 — საბოლოო ნაბიჯი
          </h2>
        </div>
        <FinalCTASection />
        {!isCompaniesLoading && companiesError && (
          <Card className="mt-8">
            <EmptyState
              icon="mdi:alert-circle-outline"
              title="დაფიქსირდა პრობლემა კომპანიის მონაცემებთან"
              description="ვაჩვენებთ დროებით მონაცემებს, სანამ რეალური კომპანიების სია ვერ იტვირთება. სცადეთ მოგვიანებით ან გადადით კატალოგში სრულადი სიის სანახავად."
              action={null}
            />
          </Card>
        )}
        {!isCompaniesLoading && !companiesError && companies.length === 0 && (
          <Card className="mt-8">
            <EmptyState
              icon="mdi:magnify-remove"
              title="კომპანიები ჯერ არ არის დამატებული"
              description="მალე აქ გამოჩნდება ვერიფიცირებული იმპორტის კომპანიები. ამ ეტაპზე შეგიძლიათ გაიცნოთ პლატფორმის შესაძლებლობები და მომავალი ინტეგრაცია რეალურ მონაცემებთან."
              action={null}
            />
          </Card>
        )}
      </div>
    </main>
  )
}
