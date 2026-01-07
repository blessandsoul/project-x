import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'

export function FinalCTASection() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  if (isAuthenticated) {
    return null
  }

  const handleClick = () => {
    window.dispatchEvent(new Event('projectx:open-auth'))
  }

  return (
    <section
      className="bg-white"
      aria-labelledby="home-final-cta-heading"
    >
      <div className="container mx-auto py-10 md:py-14">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' as const }}
        >
          <Card className="border-primary/20 bg-background/80 shadow-sm">
            <CardContent className="flex flex-col items-start gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
              <div className="space-y-2">
                <h2
                  id="home-final-cta-heading"
                  className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                  {t('home.final_cta.title')}
                </h2>
                <p className="text-sm text-muted-foreground md:text-base">
                  {t('home.final_cta.description')}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleClick}
                className="mt-2 md:mt-0"
              >
                <Icon icon="mdi:arrow-right" className="me-2 h-4 w-4" />
                {isAuthenticated ? t('home.final_cta.dashboard_btn') : t('home.final_cta.register_btn')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
