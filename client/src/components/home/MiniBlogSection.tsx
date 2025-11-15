import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'

const POSTS = [
  {
    id: 1,
    title: '3 შეცდომა, რომლებიც ხშირად ხდება აშშ-დან ავტომობილის ყიდვისას',
    description:
      'რა უნდა გაითვალისწინო აუქციონზე და როგორ აირიდო დამალული დაზიანებები.',
  },
  {
    id: 2,
    title: 'სად ჯობია აირჩიო პორტი: New York, Miami თუ California?',
    description:
      'შედარება ტრანსპორტირების ღირებულებისა და მიწოდების დროის მიხედვით.',
  },
  {
    id: 3,
    title: 'როგორ მუშაობს საბაჟო გაფორმება საქართველოში',
    description:
      'ძირითადი საფეხურები და რა დოკუმენტები დაგჭირდება მანქანის მისაღებად.',
  },
]

export function MiniBlogSection() {
  const shouldReduceMotion = useReducedMotion()

  const getCardMotionProps = (index: number) => {
    if (shouldReduceMotion) {
      return {}
    }

    const delay = index * 0.05

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25, ease: 'easeOut' as const, delay },
    }
  }
  return (
    <section
      className="border-b bg-muted/10"
      aria-labelledby="home-blog-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-blog-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              რჩევები იმპორტის შესახებ
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              მოკლე სტატეები, რომლებიც დაგეხმარება უკეთ გააგებერო პროცესი.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3" role="list">
          {POSTS.map((post, index) => (
            <motion.article
              key={post.id}
              {...getCardMotionProps(index)}
              role="listitem"
            >
              <Card className="h-full border-muted/60">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-start gap-2 text-base font-semibold">
                    <Icon
                      icon="mdi:lightbulb-on-outline"
                      className="mt-0.5 h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    <span>{post.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{post.description}</p>
                </CardContent>
              </Card>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
