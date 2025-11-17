export type HomePageCtaType = 'search' | 'catalog'

export const trackHeroCtaClick = (type: HomePageCtaType) => {
  // Centralized place to plug real analytics later
  console.log('[HomePageEvent] heroCtaClick', { type })
}

export const trackStickyCtaClick = (type: HomePageCtaType) => {
  // Centralized place to plug real analytics later
  console.log('[HomePageEvent] stickyCtaClick', { type })
}
