import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
}

const POSTS: Post[] = [
  {
    id: 1,
    titleKey: 'blog.post1.title',
    descriptionKey: 'blog.post1.description',
    views: 4280,
    tagKey: 'blog.post1.tag',
    image: '/cars/1.webp',
  },
  {
    id: 2,
    titleKey: 'blog.post2.title',
    descriptionKey: 'blog.post2.description',
    views: 3120,
    tagKey: 'blog.post2.tag',
    image: '/cars/2.webp',
  },
  {
    id: 3,
    titleKey: 'blog.post3.title',
    descriptionKey: 'blog.post3.description',
    views: 5890,
    tagKey: 'blog.post3.tag',
    image: '/cars/3.webp',
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
              {t('home.blog.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('home.blog.description')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/80" />
            <span>{t('home.blog.coming_soon_badge')}</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid gap-4 md:grid-cols-3" role="list">
            {POSTS.length === 0 ? (
              <Card className="md:col-span-3 p-8">
                <EmptyState
                  icon="mdi:file-document-outline"
                  title={t('home.blog.empty.title')}
                  description={t('home.blog.empty.description')}
                  action={(
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="inline-flex items-center gap-1"
                    >
                      <Link to="/catalog">
                        <Icon icon="mdi:view-grid" className="me-1 h-4 w-4" aria-hidden="true" />
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
                >
                  <Card className="h-full border-muted/60 overflow-hidden py-0">
                  {post.image && (
                    <div className="relative w-full overflow-hidden">
                      <img
                        src={post.image}
                        alt={t(`home.blog.posts.${post.titleKey}`)}
                        className="block w-full object-cover"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                        <span className="truncate max-w-[140px]">{t(`home.blog.posts.${post.tagKey}`)}</span>
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
                        <span>{t(`home.blog.posts.${post.titleKey}`)}</span>
                      </CardTitle>
                      {post.views > 4000 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Icon icon="mdi:fire" className="h-3 w-3" aria-hidden="true" />
                          {t('home.blog.popular_badge')}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t(`home.blog.posts.${post.descriptionKey}`)}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" className="h-3 w-3" aria-hidden="true" />
                        <span>{t('home.blog.read_time', { minutes: 3 })}</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <Icon icon="mdi:eye-outline" className="h-3 w-3" aria-hidden="true" />
                        <span>{t('home.blog.views', { count: post.views })}</span>
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
              <span>{t('home.blog.overlay_message')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
