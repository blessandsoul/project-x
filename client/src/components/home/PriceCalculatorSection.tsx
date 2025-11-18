import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react/dist/iconify.js'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useCompanySearch } from '@/hooks/useCompanySearch'
import { mockSearchFilters } from '@/mocks/_mockData'

type BudgetRange = [number, number]

const FEE_RATE = 0.28
const SLIDER_STEP = 500

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PriceCalculatorSection() {
  const navigate = useNavigate()
  const { updateFilters } = useCompanySearch()
  const shouldReduceMotion = useReducedMotion()

  const [budgetRange, setBudgetRange] = useState<BudgetRange>(() => {
    const [min, max] = mockSearchFilters.priceRange as BudgetRange

    return [min, max]
  })

  const [minBudget, maxBudget] = budgetRange

  const totalRange = useMemo<BudgetRange>(
    () => [
      Math.round(minBudget * (1 + FEE_RATE)),
      Math.round(maxBudget * (1 + FEE_RATE)),
    ],
    [minBudget, maxBudget],
  )

  const handleSliderChange = (value: number[]) => {
    if (!Array.isArray(value) || value.length === 0) {
      return
    }

    if (value.length === 1) {
      const single = value[0]
      setBudgetRange([single, single])

      return
    }

    const nextMin = Math.min(value[0], value[1])
    const nextMax = Math.max(value[0], value[1])

    setBudgetRange([nextMin, nextMax])
  }

  const handleFindCompanies = () => {
    updateFilters({
      priceRange: [minBudget, maxBudget],
    })

    navigate('/catalog')
  }

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

  const [minPrice, maxPrice] = mockSearchFilters.priceRange as BudgetRange

  return (
    <motion.section
      {...sectionMotionProps}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border-b bg-background"
      id="home-price-calculator-section"
      aria-labelledby="home-price-calculator-heading"
      role="region"
    >
      <div className="container mx-auto py-10">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle
              id="home-price-calculator-heading"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Icon
                icon="mdi:calculator-variant"
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <span>დაანგარიშეთ საერთო ღირებულება</span>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              მონიშნეთ ბიუჯეტის დიაპაზონი და მიიღეთ წარმოდგენა, რამდენი შეიძლება დაგიჯდეთ
              ავტომობილის იმპორტი აშშ-დან საქართველოში.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-[2fr,1.5fr] md:items-center">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="price-range"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    ბიუჯეტი ავტომობილზე, USD
                  </Label>
                  <Slider
                    id="price-range"
                    min={minPrice}
                    max={maxPrice}
                    step={SLIDER_STEP}
                    value={budgetRange}
                    onValueChange={handleSliderChange}
                    aria-label="ბიუჯეტის დიაპაზონი ავტომობილზე"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatUsd(minBudget)}</span>
                    <span>{formatUsd(maxBudget)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-muted/60 bg-background p-4">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="mdi:shield-check-outline"
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">სავარაუდო სრული ღირებულება</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    გათვლა მოიცავს მომსახურების საფასურს და საბაჟო გადასახადებს (დემო რეჟიმი).
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        <Icon
                          icon="mdi:shield-check-outline"
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        <span>უსაფრთხო გადახდა</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4}>
                      <p>
                        მომავალში გადასახდელი თანხა ნაწილებად დაიბლოკება და სრულად გადაეცემა
                        იმპორტიორს მხოლოდ იმპორტის დადასტურების შემდეგ. ახლა ეს არის დემო
                        ინფორმაცია.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {formatUsd(totalRange[0])} – {formatUsd(totalRange[1])}
                </p>
                <p className="text-xs text-muted-foreground">
                  ეს არის დემო გათვლა. რეალური ღირებულება შეიძლება იცვლებოდეს კომპანიების,
                  კონკრეტული აუქციონის და საბაჟო პირობების მიხედვით.
                </p>
                <Button
                  className="mt-2 w-full"
                  onClick={handleFindCompanies}
                  motionVariant="scale"
                >
                  <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" aria-hidden="true" />
                  მოძებნე კომპანიები ამ ბიუჯეტით
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  )
}
