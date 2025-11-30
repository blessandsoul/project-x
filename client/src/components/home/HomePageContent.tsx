import { HeroSection } from '@/components/home/HeroSection'

export type HomeSectionId = 'hero' | 'testimonials'

interface HomePageContentProps {
  onSectionChange?: (id: HomeSectionId) => void
}

export const HomePageContent = ({ onSectionChange }: HomePageContentProps) => {
  return (
    <main className="flex-1 overflow-hidden" role="main" aria-labelledby="home-hero-heading">
      <HeroSection onSectionChange={onSectionChange} />
    </main>
  )
}
