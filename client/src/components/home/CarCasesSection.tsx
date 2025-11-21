import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'
import { useTranslation } from 'react-i18next'

interface CarCase {
  id: number
  image: string
  titleKey: string
  subtitleKey: string
  priceKey: string
  savedKey: string
  beforeKey: string
  afterKey: string
  quoteKey: string
}

const CAR_CASES: CarCase[] = [
  {
    id: 1,
    image: '/cars/21.webp',
    titleKey: 'case1.title',
    subtitleKey: 'case1.subtitle',
    priceKey: 'case1.price',
    savedKey: 'case1.saved',
    beforeKey: 'case1.before',
    afterKey: 'case1.after',
    quoteKey: 'case1.quote',
  },
  {
    id: 2,
    image: '/cars/95.webp',
    titleKey: 'case2.title',
    subtitleKey: 'case2.subtitle',
    priceKey: 'case2.price',
    savedKey: 'case2.saved',
    beforeKey: 'case2.before',
    afterKey: 'case2.after',
    quoteKey: 'case2.quote',
  },
  {
    id: 3,
    image: '/cars/150.webp',
    titleKey: 'case3.title',
    subtitleKey: 'case3.subtitle',
    priceKey: 'case3.price',
    savedKey: 'case3.saved',
    beforeKey: 'case3.before',
    afterKey: 'case3.after',
    quoteKey: 'case3.quote',
  },
]

export function CarCasesSection() {
  const { t } = useTranslation()

  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-cases-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-cases-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {t('home.car_cases.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('home.car_cases.description')}
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1"
              motionVariant="scale"
            >
              <Link to="/catalog">
                <Icon icon="mdi:view-grid" className="me-1 h-4 w-4" aria-hidden="true" />
                <span>{t('home.car_cases.view_catalog_btn')}</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-3 [-webkit-overflow-scrolling:touch]" role="list">
          {CAR_CASES.length === 0 ? (
            <Card className="min-w-[260px] md:min-w-[320px] p-8">
              <EmptyState
                icon="mdi:car-off"
                title={t('home.car_cases.empty.title')}
                description={t('home.car_cases.empty.description')}
                action={(
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1"
                  >
                    <Link to="/catalog">
                      <Icon icon="mdi:view-grid" className="me-1 h-4 w-4" aria-hidden="true" />
                      <span>{t('home.car_cases.view_catalog_btn')}</span>
                    </Link>
                  </Button>
                )}
              />
            </Card>
          ) : (
            CAR_CASES.map((item) => (
              <Card
                key={item.id}
                className="h-full min-w-[260px] max-w-[320px] shrink-0 overflow-hidden border-muted/60 md:min-w-[320px]"
                role="listitem"
              >
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={t(`home.car_cases.cases.${item.titleKey}`)}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {t(`home.car_cases.cases.${item.titleKey}`)}
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      <Icon
                        icon="mdi:flag-variant"
                        className="me-1 h-3 w-3 text-primary"
                      />
                      {t('home.car_cases.demo_case_badge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t(`home.car_cases.cases.${item.subtitleKey}`)}</p>
                </CardHeader>
                <CardContent className="space-y-2 pb-5">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-semibold">{t('home.car_cases.before_label')}:</span> {t(`home.car_cases.cases.${item.beforeKey}`)}
                    </p>
                    <p>
                      <span className="font-semibold">{t('home.car_cases.after_label')}:</span> {t(`home.car_cases.cases.${item.afterKey}`)}
                    </p>
                  </div>
                  <p className="text-xs italic text-muted-foreground">{t(`home.car_cases.cases.${item.quoteKey}`)}</p>
                  <div className="pt-1 space-y-1">
                    <p className="text-sm font-semibold text-primary">{t(`home.car_cases.cases.${item.priceKey}`)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon icon="mdi:cash-multiple" className="h-3 w-3 text-primary" />
                      <span>{t(`home.car_cases.cases.${item.savedKey}`)}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
