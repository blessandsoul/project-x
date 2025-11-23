import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'
import { trackStickyCtaClick } from '@/lib/homePageEvents'

export function MobileStickyCta() {
  const navigate = useNavigate()

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-2 pt-2 shadow-md backdrop-blur md:hidden"
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
          კატალოგი
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            trackStickyCtaClick('auction-listings')
            navigate('/auction-listings')
          }}
          aria-label="აქტიური ლისტინგები"
          motionVariant="scale"
        >
          <Icon icon="mdi:car" className="mr-2 h-4 w-4" />
          აქტიური ლისტინგები
        </Button>
      </div>
    </div>
  )
}
