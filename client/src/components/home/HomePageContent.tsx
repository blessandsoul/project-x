import { CopartHeroSection } from '@/components/home/CopartHeroSection'
import { VehicleCatalogLinksSection } from '@/components/home/VehicleCatalogLinksSection'
import { WhatIsCopartSection } from '@/components/home/WhatIsCopartSection'
import { PromoBannersSection } from '@/components/home/PromoBannersSection'

export const HomePageContent = () => {
  return (
    <main className="flex-1" role="main">
      {/* Hero Section - Dark blue with search */}
      <CopartHeroSection />

      {/* Vehicle Catalog Links + Promo Banner */}
      <VehicleCatalogLinksSection />

      {/* What is TrustedImporters Section */}
      <WhatIsCopartSection />

      {/* Promo Banners + Follow Us */}
      <PromoBannersSection />
    </main>
  )
}
