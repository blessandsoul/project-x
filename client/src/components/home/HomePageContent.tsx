import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { HeroSection } from '@/components/home/HeroSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { useCompaniesData } from '@/hooks/useCompaniesData'
import { useCompanyStats } from '@/hooks/useCompanyStats'

const TestimonialsSectionLazy = lazy(() =>
  import('@/components/home/TestimonialsSection').then((mod) => ({
    default: mod.TestimonialsSection,
  })),
)

const MiniBlogSectionLazy = lazy(() =>
  import('@/components/home/MiniBlogSection').then((mod) => ({
    default: mod.MiniBlogSection,
  })),
)

export const HomePageContent = () => {
  const { t } = useTranslation()
  const { companies } = useCompaniesData()
  const stats = useCompanyStats(companies)

  return (
    <main className="flex-1" role="main" aria-labelledby="home-hero-heading">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Hero & Best Offers (inside HeroSection) */}
        <HeroSection stats={stats} companies={companies} />

        {/* Why Our Platform */}
        <BenefitsSection />

        {/* What clients say */}
        <Suspense fallback={null}>
          <TestimonialsSectionLazy />
        </Suspense>

        {/* Blog */}
        <Suspense fallback={null}>
          <MiniBlogSectionLazy />
        </Suspense>
      </div>
    </main>
  )
}
