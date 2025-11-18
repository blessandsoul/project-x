import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useCompanySearch } from '@/hooks/useCompanySearch'
import { mockSearchFilters } from '@/mocks/_mockData'
import { FilterTag } from '@/components/company/FilterTag'

interface ScenarioConfig {
  id: string
  label: string
  description: string
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'budget-10k',
    label: 'ბიუჯეტი • 10 000$-მდე',
    description: 'მოსახერხებელი ვარიანტები პირველი ან საყოფაცხოვრებო მანქანისთვის.',
  },
  {
    id: 'family-suv',
    label: 'ოჯახური SUV',
    description: 'კომფორტული და უსაფრთხო SUV-ები ოჯახისთვის.',
  },
  {
    id: 'premium-25k',
    label: 'პრემიუმი • 25 000$-მდე',
    description: 'ბალანსი პრემიუმ კლასს და გონივრულ ბიუჯეტს შორის.',
  },
  {
    id: 'for-resale',
    label: 'გაყიდვაზე ორიენტირებული',
    description: 'კომპანიები, რომლებსაც აქვთ გამოცდილება გადამყიდველებთან.',
  },
]

export function ReadyScenariosSection() {
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

  const handleScenarioClick = useCallback(
    (scenarioId: string) => {
      const [minPrice, maxPrice] = mockSearchFilters.priceRange as [number, number]

      if (scenarioId === 'budget-10k') {
        updateFilters({
          priceRange: [minPrice, 10000],
          rating: 3,
          vipOnly: false,
        })
      } else if (scenarioId === 'family-suv') {
        updateFilters({
          services: ['Full Import Service'],
          rating: 4,
          vipOnly: false,
        })
      } else if (scenarioId === 'premium-25k') {
        const upper = Math.min(25000, maxPrice)
        updateFilters({
          priceRange: [minPrice, upper],
          rating: 4,
          vipOnly: true,
        })
      } else if (scenarioId === 'for-resale') {
        updateFilters({
          rating: 3,
          vipOnly: true,
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
      id="home-ready-scenarios-section"
      aria-labelledby="home-ready-scenarios-heading"
      role="region"
    >
      <div className="container mx-auto py-10">
        <Card className="shadow-sm border-primary/30 bg-primary/5">
          <CardHeader className="gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:map-marker-path" className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle
                id="home-ready-scenarios-heading"
                className="text-lg font-semibold"
              >
                <span className="block text-xs font-semibold uppercase text-primary tracking-wide mb-1">
                  მინი-ქვიზი
                </span>
                <span>მზად სცენარები ძიებისთვის</span>
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              აირჩიეთ ის სცენარი, რომელიც ყველაზე ახლოს არის თქვენს საჭიროებებთან. ფილტრები
              ავტომატურად მოერგება.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {SCENARIOS.map((scenario) => (
                <FilterTag
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario.id)}
                >
                  {scenario.label}
                </FilterTag>
              ))}
            </div>
            <ul className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
              {SCENARIOS.map((scenario) => (
                <li key={`${scenario.id}-description`} className="flex items-start gap-2">
                  <Icon icon="mdi:information-outline" className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
                  <span>{scenario.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  )
}
