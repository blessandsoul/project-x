import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { EmptyState } from '@/components/company/EmptyState'
import { useTranslation } from 'react-i18next'

interface Post {
  id: number
  titleKey: string
  descriptionKey: string
  views: number
  tagKey: string
  image: string
  categoryColor: string
  takeaways: string[]
}

const POSTS: Post[] = [
  {
    id: 1,
    titleKey: 'blog.post1.title',
    descriptionKey: 'blog.post1.description',
    views: 4280,
    tagKey: 'blog.post1.tag',
    image: '/cars/1.webp',
    categoryColor: 'bg-blue-500',
    takeaways: ['Check VIN history', 'Inspect body paint', 'Verify engine noise']
  },
  {
    id: 2,
    titleKey: 'blog.post2.title',
    descriptionKey: 'blog.post2.description',
    views: 3120,
    tagKey: 'blog.post2.tag',
    image: '/cars/2.webp',
    categoryColor: 'bg-purple-500',
    takeaways: ['Review shipping terms', 'Check insurance coverage', 'Confirm hidden fees']
  },
  {
    id: 3,
    titleKey: 'blog.post3.title',
    descriptionKey: 'blog.post3.description',
    views: 5890,
    tagKey: 'blog.post3.tag',
    image: '/cars/3.webp',
    categoryColor: 'bg-green-500',
    takeaways: ['Calculate customs duty', 'Compare shipping routes', 'Book in advance']
  },
]

export function MiniBlogSection() {
  const { t } = useTranslation()
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
      className="border-b bg-background/50"
      aria-labelledby="home-blog-heading"
    >
      <div className="container mx-auto pb-12 pt-4 md:pb-20 md:pt-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-blog-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              {t('home.blog.title')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {t('home.blog.description')}
            </p>
          </div>
          <Button variant="ghost" className="group hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:bg-primary/5">
            {t('common.view_all')} 
            <Icon icon="mdi:arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3" role="list">
          {POSTS.length === 0 ? (
            <Card className="md:col-span-3 p-12 border-dashed">
              <EmptyState
                icon="mdi:file-document-outline"
                title={t('home.blog.empty.title')}
                description={t('home.blog.empty.description')}
                action={(
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-2"
                  >
                    <Link to="/catalog">
                      <Icon icon="mdi:view-grid" className="h-4 w-4" aria-hidden="true" />
                      <span>{t('home.blog.view_catalog_btn')}</span>
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
                className="group relative cursor-pointer"
              >
                <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-500 group-hover:shadow-lg">
                  {post.image && (
                    <img
                      src={post.image}
                      alt={t(`home.blog.posts.${post.titleKey}`)}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Category Pill */}
                  <div className={`absolute left-4 top-4 inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${post.categoryColor}`}>
                    {t(`home.blog.posts.${post.tagKey}`)}
                  </div>

                  {/* Bookmark Action */}
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40">
                     <Icon icon="mdi:bookmark-outline" className="h-4 w-4" />
                  </div>

                  {/* Key Takeaways Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="translate-y-4 transform transition-transform duration-300 group-hover:translate-y-0">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('home.blog.takeaways_title')}
                      </p>
                      <ul className="space-y-1.5">
                        {post.takeaways.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white">
                            <Icon icon="mdi:check-circle" className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 pr-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="text-foreground">Oct 24, 2025</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1">
                      <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
                      <span>{t('home.blog.read_time', { minutes: 3 })}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {t(`home.blog.posts.${post.titleKey}`)}
                  </h3>
                  
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`home.blog.posts.${post.descriptionKey}`)}
                  </p>
                  
                  <div className="pt-1">
                    <span className="group/link inline-flex items-center gap-1 text-sm font-bold text-primary decoration-primary/30 underline-offset-4 transition-all hover:underline">
                      Read Article <Icon icon="mdi:arrow-right" className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
