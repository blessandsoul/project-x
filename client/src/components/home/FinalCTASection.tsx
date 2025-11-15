import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

export function FinalCTASection() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  return (
    <section
      className="bg-primary/5"
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
                მზად ხართ დაიწყოთ იმპორტი აშშ-დან?
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                შეარჩიეთ სანდო კომპანია, მიიღეთ საუკეთესო შეთავაზება და
                ისარგებლეთ გამჭვირვალე პირობებით.
              </p>
            </div>
              <Button
                size="lg"
                onClick={handleClick}
                className="mt-2 md:mt-0"
                motionVariant="scale"
              >
                <Icon icon="mdi:arrow-right" className="mr-2 h-4 w-4" />
                {isAuthenticated ? 'გახსენი დაფა' : 'დაიწყე რეგისტრაცია'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
