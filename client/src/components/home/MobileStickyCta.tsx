<<<<<<< Updated upstream
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
=======
import { Icon } from '@iconify/react';

export function MobileStickyCta() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient Fade for content under */}
      <div className="absolute bottom-full left-0 w-full h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
      
      <div className="bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex gap-3 safe-area-pb">
        <a 
          href="tel:+995555000000"
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-red-600/20 transition-transform active:scale-[0.98]"
>>>>>>> Stashed changes
        >
          <div className="bg-white/20 p-1.5 rounded-full">
             <Icon icon="mdi:phone" className="h-5 w-5" />
          </div>
          <span>Call Support</span>
        </a>
        
        <a 
          href="https://t.me/trustedimporters"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-transform active:scale-[0.98]"
          aria-label="Chat on Telegram"
        >
           <Icon icon="mdi:telegram" className="h-7 w-7" />
        </a>
      </div>
    </div>
  );
}
