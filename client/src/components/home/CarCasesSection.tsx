import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react/dist/iconify.js'

interface CarCase {
  id: number
  image: string
  title: string
  subtitle: string
  price: string
  saved: string
}

const CAR_CASES: CarCase[] = [
  {
    id: 1,
    image: '/cars/21.webp',
    title: 'BMW X5, 2018',
    subtitle: 'California → საქართველო',
    price: '$19 800 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $1 200 აუქციონის საშუალო ფასთან შედარებით',
  },
  {
    id: 2,
    image: '/cars/95.webp',
    title: 'Toyota Camry, 2019',
    subtitle: 'Florida → საქართველო',
    price: '$12 400 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $900 ადგილობრივ ბაზართან შედარებით',
  },
  {
    id: 3,
    image: '/cars/150.webp',
    title: 'Mercedes-Benz C-Class, 2017',
    subtitle: 'New York → საქართველო',
    price: '$17 300 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $1 500 დილერის შეთავაზებასთან შედარებით',
  },
]

export function CarCasesSection() {
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
              რეალური მაგალითები მანქანების იმპორტიდან
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              სანახავი რამდენიმე ტიპური შემთხვევა ფასით და სავარაუდო დაზოგვით.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CAR_CASES.map((item) => (
            <Card key={item.id} className="h-full overflow-hidden border-muted/60">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {item.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px]">
                    <Icon
                      icon="mdi:flag-variant"
                      className="mr-1 h-3 w-3 text-primary"
                    />
                    Demo case
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                <p className="text-sm font-semibold text-primary">{item.price}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon icon="mdi:cash-multiple" className="h-3 w-3 text-primary" />
                  <span>{item.saved}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
