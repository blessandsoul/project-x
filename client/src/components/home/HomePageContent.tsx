import { Suspense, lazy } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'

const TestimonialsSectionLazy = lazy(() =>
  import('@/components/home/testimonials').then((mod) => ({
    default: mod.TestimonialsSection,
  })),
)

const MiniBlogSectionLazy = lazy(() =>
  import('@/components/home/MiniBlogSection').then((mod) => ({
    default: mod.MiniBlogSection,
  })),
)

export const HomePageContent = () => {
  return (
    <main className="flex-1" role="main" aria-labelledby="home-hero-heading">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Hero & Best Offers (inside HeroSection) */}
        <HeroSection />

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
