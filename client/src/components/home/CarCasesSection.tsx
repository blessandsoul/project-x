import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'

interface CarCase {
  id: number
  image: string
  title: string
  subtitle: string
  price: string
  saved: string
  before: string
  after: string
  quote: string
}

const CAR_CASES: CarCase[] = [
  {
    id: 1,
    image: '/cars/21.webp',
    title: 'BMW X5, 2018',
    subtitle: 'California → საქართველო',
    price: '$19 800 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $1 200 აუქციონის საშუალო ფასთან შედარებით',
    before: 'მანამდე ოჯახი ნახევარ წელზე მეტს ეძებდა უსაფრთხო SUV-ს ადგილობრივ ბაზარზე, მაგრამ ფასები ყოველთვის ბიუჯეტს აღემატებოდა.',
    after: 'TrustedImporters.Ge-ის საშუალებით 6 კვირაში მიიღეს X5 სრულ იმპორტით და დაზოგეს თანხა, რომელიც სარემონტო სამუშაოებსაც ეყო.',
    quote: '"ვფიქრობდით, რომ X5 მხოლოდ ოცნება იყო, ახლა კი უკვე ოჯახური მანქანაა."',
  },
  {
    id: 2,
    image: '/cars/95.webp',
    title: 'Toyota Camry, 2019',
    subtitle: 'Florida → საქართველო',
    price: '$12 400 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $900 ადგილობრივ ბაზართან შედარებით',
    before: 'მანამდე მყიდველს სჭირდებოდა საიმედო სედანი დღის სამუშაოსა და ოჯახის გზებისთვის, მაგრამ კარგ ვარიანტს ვერ პოულობდა.',
    after: 'პლატფორმამ აჩვენა რამდენიმე სანდო იმპორტიორი და Camry მოვიდა მინიმალური გარბენითა და გამჭვირვალე ისტორიით.',
    quote: '"პირველი მანქანის არჩევა ძალიან გვაშინებდა, მაგრამ პროცესი ბევრად მარტივი აღმოჩნდა, ვიდრე ველოდით."',
  },
  {
    id: 3,
    image: '/cars/150.webp',
    title: 'Mercedes-Benz C-Class, 2017',
    subtitle: 'New York → საქართველო',
    price: '$17 300 სრული იმპორტით',
    saved: 'დაზოგვა ≈ $1 500 დილერის შეთავაზებასთან შედარებით',
    before: 'ადგილობრივ დილერთან შეთავაზებული პრემიუმ სედანი წინასწარ გადახდას და დამატებით მალულ გადასახადებს მოითხოვდა.',
    after: 'TrustedImporters.Ge-მა აჩვენა ალTERNATივი აშშ-დან იმპორტით, სადაც კლიენტმა ზუსტად იცოდა, რისთვის იხდიდა.',
    quote: '"იმის ცოდნა, რომ ყოველ საფეხურს ვაკონტროლებდით, ბევრად უფრო მშვიდად გვაგრძნობინებდა."',
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
          <div className="mt-2 md:mt-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1"
              motionVariant="scale"
            >
              <Link to="/catalog">
                <Icon icon="mdi:view-grid" className="h-4 w-4" aria-hidden="true" />
                <span>კატალოგის ნახვა</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-3 [-webkit-overflow-scrolling:touch]" role="list">
          {CAR_CASES.length === 0 ? (
            <Card className="min-w-[260px] md:min-w-[320px] p-8">
              <EmptyState
                icon="mdi:car-off"
                title="იმპორტის მაგალითები ჯერ არ არის ნაჩვენები"
                description="როგორც კი რეალური იმპორტის მაგალითები დაემატება პლატფორმას, ისინი გამოჩნდება ამ ბლოკში. ამ ეტაპზე შეგიძლიათ გაეცნოთ იმპორტის კომპანიებს კატალოგში."
                action={(
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1"
                  >
                    <Link to="/catalog">
                      <Icon icon="mdi:view-grid" className="h-4 w-4" aria-hidden="true" />
                      <span>კატალოგის ნახვა</span>
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
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-semibold">მანამდე:</span> {item.before}
                    </p>
                    <p>
                      <span className="font-semibold">შემდეგ:</span> {item.after}
                    </p>
                  </div>
                  <p className="text-xs italic text-muted-foreground">{item.quote}</p>
                  <div className="pt-1 space-y-1">
                    <p className="text-sm font-semibold text-primary">{item.price}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon icon="mdi:cash-multiple" className="h-3 w-3 text-primary" />
                      <span>{item.saved}</span>
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
