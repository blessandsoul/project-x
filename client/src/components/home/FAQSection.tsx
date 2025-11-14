import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'რამდენი ჯდება აშშ-დან ავტომობილის შემოტანა? ',
    answer:
      'ფასი დამოკიდებულია აუქციონის ფასზე, ტრანსპორტირებაზე, დაზღვევასა და საბაჟო გადასახადებზე. ჩვენი პლატფორმა გეხმარებათ წინასწარი შეფასების მიღებაში.',
  },
  {
    id: 2,
    question: 'რამდენი დრო სჭირდება მანქანის ჩამოყვანას? ',
    answer:
      'საშუალოდ 6-10 კვირა, დამოკიდებულია პორტსა და სატრანსპორტო მარშრუტზე. კონკრეტულ ვადას კომპანია გეტყვით.',
  },
  {
    id: 3,
    question: 'როგორ ხდება კომპანიების შემოწმება? ',
    answer:
      'ვაკვირდებით გამოცდილებას, რეიტინგებს და მომხმარებელთა შეფასებებს. საეჭვო კომპანიები ვერ ხვდებიან რეკომენდირებულ სიისში.',
  },
  {
    id: 4,
    question: 'შემიძლია რამდენიმე კომპანიის შეთავაზების შედარება? ',
    answer:
      'დიახ, შეგიძლიათ შეადაროთ ფასები, მომსახურება და რეიტინგები სხვადასხვა კომპანიის მიხედვით.',
  },
]

export function FAQSection() {
  return (
    <section
      className="border-b bg-background"
      aria-labelledby="home-faq-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6">
          <h2
            id="home-faq-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            ხშირი კითხვები
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            პასუხები ყველაზე გავრცელებულ კითხვებზე იმპორტის პროცესის შესახებ.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <Card key={item.id} className="border-muted/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
