import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useTranslation } from 'react-i18next'

export const BENEFITS = [
  {
    id: 'verified',
    icon: 'mdi:shield-check',
  },
  {
    id: 'transparent',
    icon: 'mdi:cash-multiple',
  },
  {
    id: 'reviews',
    icon: 'mdi:star-circle',
  },
  {
    id: 'support',
    icon: 'mdi:chat-processing',
  },
]

export function BenefitsSection() {
  const { t } = useTranslation()

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-benefits-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6">
          <h2
            id="home-benefits-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            {t('home.benefits.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('home.benefits.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <Card
              key={benefit.id}
              className="relative h-full border-muted/60"
            >
              <div className="flex h-full flex-col items-start">
                <CardHeader className="w-full space-y-2 pr-16 pb-3">
                  <CardTitle className="text-base font-semibold text-left">
                    {t(`home.benefits.items.${benefit.id}.title`)}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 pr-6">
                  <p className="max-w-xs text-sm text-left text-muted-foreground">
                    {t(`home.benefits.items.${benefit.id}.description`)}
                  </p>
                </CardContent>

                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon icon={benefit.icon} className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
