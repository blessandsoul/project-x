import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { trackStickyCtaClick } from '@/lib/homePageEvents'

export function MobileStickyCta() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [isHidden, setIsHidden] = useState(false)

  const isCatalogPage = location.pathname === '/catalog' || location.pathname === '/companies'

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
        {isCatalogPage ? (
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={() => {
              navigate('/auction-listings')
            }}
            aria-label={t('navigation.auctionListings') || 'Auction Listings'}
            motionVariant="scale"
          >
            <Icon icon="mdi:gavel" className="mr-2 h-4 w-4" />
            <span className="truncate text-sm font-medium">{t('navigation.auctionListings') || 'Auction Listings'}</span>
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              trackStickyCtaClick('catalog')
              navigate('/catalog')
            }}
            aria-label={t('navigation.catalog') || 'Company Catalog'}
            motionVariant="scale"
          >
            <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
            <span className="truncate text-sm font-medium">{t('navigation.catalog') || 'Company Catalog'}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
