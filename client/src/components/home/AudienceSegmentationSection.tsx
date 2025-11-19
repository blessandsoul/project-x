import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useCompanySearch } from '@/hooks/useCompanySearch'
import { mockSearchFilters } from '@/mocks/_mockData'

interface PersonaConfig {
  id: string
  title: string
  description: string
  icon: string
  ctaLabel: string
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'first-time',
    title: 'პირველად შემომყავს მანქანა აშშ-დან',
    description:
      'გჭირდება მეგზური ეტაპობრივად — აუქციონიდან თბილისში მიწოდებამდე, დოკუმენტებისა და კომუნიკაციის სრული მხარდაჭერით.',
    icon: 'mdi:account-star',
    ctaLabel: 'დამწყებისთვის',
  },
  {
    id: 'reseller',
    title: 'სალონებისა და დილერებისთვის',
    description:
      'გეძებება სტაბილური პარტნიორი, ვინც შესთავაზებს ჰოლსეილ ფასებს, სწრაფ ლოჯისტიკას და პროგნოზირებად გრაფიკს რეგულარული პარტიებისთვის.',
    icon: 'mdi:briefcase',
    ctaLabel: 'იპოვე პარტნიორი',
  },
  {
    id: 'safe-first',
    title: 'მაქსიმალური სანდოობა და მინიმალური რისკი',
    description:
      'გინდა მხოლოდ კარგად შემოწმებული კომპანიები, გამჭვირვალე კონტრაქტები და მაღალი რეიტინგი წინა კლიენტებისგან.',
    icon: 'mdi:shield-check-outline',
    ctaLabel: 'ტოპ რეიტინგული კომპანიები',
  },
  {
    id: 'budget',
    title: 'მინიმალური ბიუჯეტი, მაქსიმალური სარგებელი',
    description:
      'შენთვის მთავარი საერთო ბიუჯეტია — მზად ხარ ცოტა მეტხანს დაელოდო, თუ საბოლოო ხარჯი შემცირდება და ფასი უფრო ხელმისაწვდომი იქნება.',
    icon: 'mdi:cash-multiple',
    ctaLabel: 'ხელმისაწვდომი შეთავაზებები',
  },
]

export function AudienceSegmentationSection() {
  const navigate = useNavigate()
  const { updateFilters } = useCompanySearch()
  const shouldReduceMotion = useReducedMotion()

  const defaultSectionMotionProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  } as const

  const reducedSectionMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  } as const

  const sectionMotionProps = shouldReduceMotion
    ? reducedSectionMotionProps
    : defaultSectionMotionProps

  const handleSelectPersona = useCallback(
    (id: string) => {
      const [priceMin, priceMax] = mockSearchFilters.priceRange as [number, number]

      if (id === 'first-time') {
        updateFilters({
          services: ['Full Import Service'],
          rating: 3,
          vipOnly: false,
        })
      } else if (id === 'reseller') {
        updateFilters({
          services: ['Shipping', 'Customs Clearance'],
          priceRange: [priceMin, priceMax],
          rating: 4,
          vipOnly: true,
        })
      } else if (id === 'safe-first') {
        updateFilters({
          rating: 4,
          vipOnly: true,
        })
      } else if (id === 'budget') {
        const midPrice = Math.round((priceMin + priceMax) / 2)
        updateFilters({
          priceRange: [priceMin, midPrice],
          rating: 3,
          vipOnly: false,
        })
      }

      navigate('/catalog')
    },
    [navigate, updateFilters],
  )

  return (
    <motion.section
      {...sectionMotionProps}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border-b bg-background"
      aria-labelledby="home-audience-segmentation-heading"
      role="region"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-audience-segmentation-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              ვისთვის არის ეს პლატფორმა
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              აირჩიეთ სცენარი, რომელიც ყველაზე მეტად გიგავს, და ჩვენ გაჩვენებთ იმ კომპანიებს,
              რომლებიც თქვენ საჭიროებებს ერგება.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PERSONAS.map((persona) => (
            <Card key={persona.id} className="h-full shadow-sm">
              <CardHeader className="flex flex-row items-start gap-3 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon icon={persona.icon} className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold md:text-base">
                    {persona.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-4 pt-0 text-sm text-muted-foreground">
                <p>{persona.description}</p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  variant="outline"
                  onClick={() => handleSelectPersona(persona.id)}
                  motionVariant="scale"
                >
                  <Icon icon="mdi:arrow-right" className="mr-2 h-4 w-4" aria-hidden="true" />
                  {persona.ctaLabel}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
