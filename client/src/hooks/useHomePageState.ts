import { useEffect, useState } from 'react'

export type HomePageStatus = 'loading' | 'ready' | 'error' | 'empty'

export const useHomePageState = () => {
  const [status, setStatus] = useState<HomePageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [isStickyCtaVisible, setIsStickyCtaVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('ready')
    }, 700)

    return () => clearTimeout(timer)
  }, [])

  const loading = status === 'loading'

  const showStickyCta = () => {
    setIsStickyCtaVisible(true)
  }

  const hideStickyCta = () => {
    setIsStickyCtaVisible(false)
  }

  return {
    status,
    loading,
    error,
    isEmpty,
    isStickyCtaVisible,
    setStatus,
    setError,
    setIsEmpty,
    showStickyCta,
    hideStickyCta,
  }
}
