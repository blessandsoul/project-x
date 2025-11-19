import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'

const POSTS = [
  {
    id: 1,
    title: '3 შეცდომა, რომლებიც ხშირად ხდება აშშ-დან ავტომობილის ყიდვისას',
    description:
      'რა უნდა გაითვალისწინო აუქციონზე, როგორ ამოიცნო „ლამაზი ფოტო“ და დამალული დაზიანებები.',
    views: 4280,
    tag: 'შეცდომები',
    image: '/cars/1.webp',
  },
  {
    id: 2,
    title: 'სად ჯობია აირჩიო პორტი: New York, Miami თუ California?',
    description:
      'ცოცხალი მაგალითები ფასის, ვადის და სარისკო სცენარების შედარებით.',
    views: 3120,
    tag: 'პორტები და მარშრუტები',
    image: '/cars/2.webp',
  },
  {
    id: 3,
    title: 'როგორ მუშაობს საბაჟო გაფორმება საქართველოში — მარტივად ახსნილი',
    description:
      'სტეპ-ბაი-სტეპ ახსნა, რა დაგჭირდება, სად ხარჯავ ფულს და როგორ არ „გაიჭედო“ საზღვარზე.',
    views: 5890,
    tag: 'საბაჟო და გადასახადები',
    image: '/cars/3.webp',
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
      className="border-b bg-background"
      aria-labelledby="home-blog-heading"
    >
      <div className="container mx-auto pb-10 pt-4 md:pb-12 md:pt-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-blog-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              რჩევები იმპორტის შესახებ
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              მოკლე, მაგრამ „სქროლს რომ გაჩერებს“ სტატეები, რომლებიც დაგეხმარება უკეთ გააგებერო პროცესი.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/80" />
            <span>Blog module • Coming Soon — ცალკე სტატიის გვერდები ჯერ მზადების პროცესშია</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid gap-4 md:grid-cols-3" role="list">
            {POSTS.length === 0 ? (
              <Card className="md:col-span-3 p-8">
                <EmptyState
                  icon="mdi:file-document-outline"
                  title="სტატიები ჯერ არ არის დამატებული"
                  description="როგორც კი სასარგებლო რჩევები და სტატეები დაემატება პლატფორმას, ისინი გამოჩნდება აქ. ამ ეტაპზე შეგიძლიათ გაეცნოთ იმპორტის კომპანიებს კატალოგში."
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
              POSTS.map((post, index) => (
                <motion.article
                  key={post.id}
                  {...getCardMotionProps(index)}
                  role="listitem"
                >
                  <Card className="h-full border-muted/60 overflow-hidden py-0">
                  {post.image && (
                    <div className="relative w-full overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="block w-full object-cover"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                        <span className="truncate max-w-[140px]">{post.tag}</span>
                      </div>
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-start gap-2 text-base font-semibold">
                        <Icon
                          icon="mdi:lightbulb-on-outline"
                          className="mt-0.5 h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                        <span>{post.title}</span>
                      </CardTitle>
                      {post.views > 4000 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Icon icon="mdi:fire" className="h-3 w-3" aria-hidden="true" />
                          პოპულარული
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{post.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" className="h-3 w-3" aria-hidden="true" />
                        <span>~3 წუთი კითხვას</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <Icon icon="mdi:eye-outline" className="h-3 w-3" aria-hidden="true" />
                        <span>{post.views.toLocaleString()} ნახვა</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.article>
            ))
          )}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-background/70 backdrop-blur-[2px] border border-dashed border-muted flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Icon icon="mdi:lock-clock" className="h-4 w-4" aria-hidden="true" />
              <span>მზადების პროცესში!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
