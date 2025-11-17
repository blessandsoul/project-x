import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import type { CompanyStats } from '@/hooks/useCompanyStats'
import { trackHeroCtaClick } from '@/lib/homePageEvents'

type HeroSectionProps = {
  stats: CompanyStats
}

export function HeroSection({ stats }: HeroSectionProps) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const trustScore = stats.avgRating.toFixed(1)
  const estimatedDeals = Math.max(stats.total * 10, 20)
  const activeCompanyViewers = 15
  const activeVehicleViewers = 12

  const scrollToSection = (sectionId: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const target = document.getElementById(sectionId)
    if (!target) return

    const rect = target.getBoundingClientRect()
    const viewportHeight = window.innerHeight || 0
    const targetHeight = rect.height || 0

    const absoluteTop = window.scrollY + rect.top
    const desiredTop = absoluteTop - (viewportHeight / 2 - targetHeight / 2)

    window.scrollTo({
      top: Math.max(desiredTop, 0),
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-hero-heading"
    >
      <div className="container mx-auto py-4 md:py-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <motion.div
            className="space-y-6"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon icon="mdi:shield-check" className="mr-1 h-3 w-3" />
              სანდო იმპორტის პლატფორმა აშშ-დან საქართველოში
            </div>
            <div className="space-y-4">
              <h1
                id="home-hero-heading"
                className="text-3xl font-bold tracking-tight md:text-5xl"
              >
                იპოვეთ სანდო კომპანიები ავტომობილების იმპორტისთვის აშშ-დან
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                შეადარეთ ფასები, რეიტინგები და მომსახურება ერთ სივრცეში.
                გამჭვირვალე პირობები, ვერიფიცირებული იმპორტიორები და
                მხარდაჭერა ქართულ ენაზე.
              </p>
              <div className="mt-2 space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  როგორ მუშაობს: 3 მარტივი ნაბიჯი
                </p>
                <ol className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-price-calculator-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        1
                      </span>
                      <span>აირჩიე ბიუჯეტი და საიდან გინდა მანქანა.</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-ready-scenarios-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        2
                      </span>
                      <span>მიუთითე სასურველი ტიპი: sedan, SUV, პრემიუმი და ა.შ.</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('home-featured-companies-section')}
                      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        3
                      </span>
                      <span>მიიღე შესაფერისი იმპორტის კომპანიების подборი.</span>
                    </button>
                  </li>
                </ol>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => {
                  trackHeroCtaClick('search')
                  navigate('/search')
                }}
                motionVariant="scale"
              >
                <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                იპოვე კომპანია
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  trackHeroCtaClick('catalog')
                  navigate('/catalog')
                }}
                motionVariant="scale"
              >
                <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
                კატალოგის ნახვა
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              რამდენიმე წუთში მივიღებთ მინიმუმ 3 სანდო კომპანიის ვარიანტს თქვენი მოთხოვნების
              მიხედვით.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:check-circle"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>ვერიფიცირებული იმპორტიორები</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:cash"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>გამჭვირვალე ფასები</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:account-voice"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span>მხარდაჭერა ქართულ ენაზე</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center md:justify-end"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' as const, delay: 0.08 }}
          >
            <Card className="w-full max-w-sm border-primary/20 bg-background/80 shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      TrustedImporters.Ge
                    </span>
                    <span className="text-sm font-semibold">
                      {trustScore}/5
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({estimatedDeals}+ წარმატებული იმპორტი • დემო)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-primary">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5">
                      <Icon
                        icon="mdi:shield-check-outline"
                        className="mr-1 h-3 w-3"
                        aria-hidden="true"
                      />
                      <span>Buyer Protection</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5">
                      <Icon
                        icon="mdi:check-decagram"
                        className="mr-1 h-3 w-3"
                        aria-hidden="true"
                      />
                      <span>Verified Importers</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  სტატისტიკა პლატფორმაზე
                </p>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      კომპანია
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.vip}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      VIP იმპორტიორი
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.avgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      საშუალო რეიტინგი
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  მონაცემები ეფუძნება კატალოგში არსებულ იმპორტის კომპანიებს და მათ მომხმარებელთა
                  შეფასებებს (დემო რეჟიმი).
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:eye"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <p>
                      ახლა {activeCompanyViewers} მომხმარებელი ათვალიერებს იმპორტის კომპანიებს.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:car"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <p>
                      ახლა {activeVehicleViewers} მომხმარებელი ათვალიერებს ავტომობილების ლოტებს.
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-muted/50 bg-background p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:information-outline"
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <p>
                      ყველა მონაცემი არის დემო რეჟიმში და მომავალი API-ის
                      ინტეგრაციისთვის მზად.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
