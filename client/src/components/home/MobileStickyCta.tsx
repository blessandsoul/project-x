import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { trackStickyCtaClick } from '@/lib/homePageEvents'

export function MobileStickyCta() {
  const navigate = useNavigate()
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY || 0

    const handleScroll = () => {
      const currentY = window.scrollY || 0
      const delta = currentY - lastScrollY

      if (Math.abs(delta) < 4) {
        lastScrollY = currentY
        return
      }

      if (currentY > 64 && delta > 0) {
        setIsHidden(true)
      } else if (delta < 0) {
        setIsHidden(false)
      }

      lastScrollY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-2 pt-2 shadow-md backdrop-blur md:hidden transform transition-transform duration-200 ease-out will-change-transform ${isHidden ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 px-4">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => {
            trackStickyCtaClick('catalog')
            navigate('/catalog')
          }}
          aria-label="კომპანიების კატალოგი"
          motionVariant="scale"
        >
          <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
          <span className="truncate text-sm font-medium">კომპანიების კატალოგი</span>
        </Button>

        <Button
          size="sm"
          variant="default"
          className="flex-1"
          onClick={() => {
            trackStickyCtaClick('quote')
            navigate('/leads/vehicle')
          }}
          aria-label="მიიღე განახლებული შეთავაზებები"
          motionVariant="scale"
        >
          <Icon icon="mdi:cars" className="mr-2 h-4 w-4" />
          <span className="truncate text-sm font-semibold">მიიღე შეთავაზებები</span>
        </Button>
      </div>
    </div>
  )
}
