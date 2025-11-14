import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'

export function TrustSection() {
  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-trust-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon icon="mdi:shield-check" className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle
                  id="home-trust-heading"
                  className="text-lg font-semibold md:text-xl"
                >
                  როგორ ვამოწმებთ კომპანიებს
                </CardTitle>
                <p className="text-xs text-muted-foreground md:text-sm">
                  ჩვენი მიზანია, რომ მხოლოდ სანდო იმპორტიორები მოხვდნენ თქვენს სიაში.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-4">
            <div className="flex items-start gap-2">
              <Icon icon="mdi:clipboard-check" className="mt-0.5 h-4 w-4 text-primary" />
              <p>ვამოწმებთ გამოცდილებას, შესრულებულ ბრძანებებს და ბაზარზე ყოფნის პერიოდს.</p>
            </div>
            <div className="flex items-start gap-2">
              <Icon icon="mdi:star-circle" className="mt-0.5 h-4 w-4 text-primary" />
              <p>ვაკვირდებით რეიტინგებსა და მომხმარებელთა შეფასებებს ჩვენს პლატფორმაზე.</p>
            </div>
            <div className="flex items-start gap-2">
              <Icon icon="mdi:file-document-check" className="mt-0.5 h-4 w-4 text-primary" />
              <p>ვკითხულობთ დოკუმენტაციას, საკონტაქტო ინფორმაციასა და იურიდიულ დეტალებს.</p>
            </div>
            <div className="flex items-start gap-2">
              <Icon icon="mdi:lock" className="mt-0.5 h-4 w-4 text-primary" />
              <p>არასოდეს ვუზიარებთ თქვენს პირად მონაცემებს მესამე პირებს დაუკითხავად.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
