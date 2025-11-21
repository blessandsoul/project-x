import { useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useTranslation } from 'react-i18next'

interface FAQItem {
  id: number
  key: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    key: '1',
  },
  {
    id: 2,
    key: '2',
  },
  {
    id: 3,
    key: '3',
  },
  {
    id: 4,
    key: '4',
  },
]

export function FAQSection() {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  const [openId, setOpenId] = useState<number | null>(FAQ_ITEMS[0]?.id ?? null)

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
      aria-labelledby="home-faq-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6">
          <h2
            id="home-faq-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            {t('home.faq.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('home.faq.description')}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2" role="list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openId === item.id

            return (
              <motion.article
                key={item.id}
                {...getCardMotionProps(index)}
                role="listitem"
              >
                <Card className="border-muted/60">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                  >
                    <span className="text-sm font-medium md:text-base">
                      {t(`home.faq.items.${item.key}.question`)}
                    </span>
                    <motion.span
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { rotate: isOpen ? 180 : 0 }
                      }
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <Icon
                        icon="mdi:chevron-down"
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${item.id}`}
                        initial={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : { height: 'auto', opacity: 1 }
                        }
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <CardContent className="px-4 pb-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            {t(`home.faq.items.${item.key}.answer`)}
                          </p>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
