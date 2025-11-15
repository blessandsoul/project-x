import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'

export function MobileStickyCta() {
  const navigate = useNavigate()

  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-2 pt-2 shadow-md backdrop-blur md:hidden">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate('/search')}
            aria-label="ძიება კომპანიების მიხედვით"
            motionVariant="scale"
          >
            <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
            ძიება
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/catalog')}
            aria-label="კომპანიების კატალოგი"
            motionVariant="scale"
          >
            <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
            კატალოგი
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-2 pt-2 shadow-md backdrop-blur md:hidden"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 px-4">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => navigate('/search')}
          aria-label="ძიება კომპანიების მიხედვით"
          motionVariant="scale"
        >
          <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
          ძიება
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/catalog')}
          aria-label="კომპანიების კატალოგი"
          motionVariant="scale"
        >
          <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
          კატალოგი
        </Button>
      </div>
    </motion.div>
  )
}
