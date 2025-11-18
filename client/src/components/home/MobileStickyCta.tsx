import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { trackStickyCtaClick } from '@/lib/homePageEvents'

export function MobileStickyCta() {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleExpand = () => {
    setIsCollapsed(false)
  }

  const handleCollapse = () => {
    setIsCollapsed(true)
  }

  const Wrapper = shouldReduceMotion ? 'div' : motion.div

  return (
    <Wrapper
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-2 pt-2 shadow-md backdrop-blur md:hidden"
      {...(!shouldReduceMotion && {
        initial: { opacity: 0, y: 32 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: 'easeOut' as const },
      })}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 px-4">
        {isCollapsed ? (
          <button
            type="button"
            onClick={handleExpand}
            className="flex flex-1 items-center justify-between gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground"
            aria-label="გახსენი სწრაფი ძიების ბარი"
          >
            <div className="flex items-center gap-2">
              <Icon icon="mdi:magnify" className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>სწრაფი ძიება და კატალოგი</span>
            </div>
            <Icon icon="mdi:chevron-up" className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 text-muted-foreground"
              aria-label="დახურვა ქვედა ბარის"
            >
              <Icon icon="mdi:chevron-down" className="h-4 w-4" aria-hidden="true" />
            </button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                trackStickyCtaClick('catalog')
                navigate('/catalog')
              }}
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
              onClick={() => {
                trackStickyCtaClick('catalog')
                navigate('/catalog')
              }}
              aria-label="კომპანიების კატალოგი"
              motionVariant="scale"
            >
              <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
              კატალოგი
            </Button>
          </>
        )}
      </div>
    </Wrapper>
  )
}
