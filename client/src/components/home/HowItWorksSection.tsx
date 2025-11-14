import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'

const STEPS = [
  {
    id: 1,
    icon: 'mdi:magnify',
    title: 'აირჩიე კომპანია',
    description: 'მოძებნე იმპორტიორები ფილტრაციის და რეიტინგების მიხედვით.',
  },
  {
    id: 2,
    icon: 'mdi:message-text',
    title: 'დაუკავშირდი',
    description: 'შეათანხმე დეტალები, პირობები და სერვისის მოცულობა.',
  },
  {
    id: 3,
    icon: 'mdi:file-document-check',
    title: 'დოკუმენტები და გადახდა',
    description: 'კომპანია გეხმარება დოკუმენტაციაში და გადახდის ორგანიზებაში.',
  },
  {
    id: 4,
    icon: 'mdi:car-multiple',
    title: 'ავტომობილი საქართველოში',
    description: 'შეკვეთილი მანქანა ჩამოდის პორტში და გადადის თქვენს ხელში.',
  },
]

export function HowItWorksSection() {
  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-how-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-how-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              როგორ მუშაობს
            </h2>
            <p className="text-sm text-muted-foreground">
              სრული პროცესი ერთი გვერდიდან: არჩევიდან საბოლოო მიწოდებამდე.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((step) => (
            <Card key={step.id} className="h-full border-muted/60">
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon icon={step.icon} className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
