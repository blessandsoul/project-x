import { useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react/dist/iconify.js'

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
            ხშირი კითხვები
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            პასუხები ყველაზე გავრცელებულ კითხვებზე იმპორტის პროცესის შესახებ.
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
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                  >
                    <span className="text-sm font-medium md:text-base">
                      {item.question}
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
                            {item.answer}
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
