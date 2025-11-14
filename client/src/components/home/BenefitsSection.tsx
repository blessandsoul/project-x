import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'

const BENEFITS = [
  {
    id: 1,
    icon: 'mdi:shield-check',
    title: 'ვერიფიცირებული იმპორტიორები',
    description: 'ყველა კომპანია გადის მინიმალურ შემოწმებას სანდოობის და გამოცდილების მიხედვით.',
  },
  {
    id: 2,
    icon: 'mdi:cash-multiple',
    title: 'გამჭვირვალე ფასები',
    description: 'დაახლოებით ღირებულება ჩანს წინასწარ, დამალული საკომისიოებისა და გადასახადების გარეშე.',
  },
  {
    id: 3,
    icon: 'mdi:star-circle',
    title: 'რეალური შეფასებები',
    description: 'კომპანიების რეიტინგი დაფუძნებულია მყიდველების შეფასებებსა და გამოცდილებაზე.',
  },
  {
    id: 4,
    icon: 'mdi:chat-processing',
    title: 'მხარდაჭერა ქართულ ენზე',
    description: 'ჩვენი გუნდი დაგეხმარებათ ბუნდოვანი საკითხების განმარტებაში და სწორი არჩევანის გაკეთებაში.',
  },
]

export function BenefitsSection() {
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
            რატომ ჩვენი პლატფორმა
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            მთავარი უპირატესობები, რომლებიც თქვენი გადაწყვეტილების მიღებას ამარტივებს.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.id} className="h-full border-muted/60">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon icon={benefit.icon} className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
