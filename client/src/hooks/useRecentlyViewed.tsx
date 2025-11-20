import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface RecentlyViewedState {
  ids: string[]
}

type RecentlyViewedAction =
  | { type: 'SET'; payload: string[] }
  | { type: 'ADD'; payload: string }
  | { type: 'CLEAR' }

interface RecentlyViewedContextValue {
  recentlyViewed: string[]
  addRecentlyViewed: (companyId: string) => void
  clearRecentlyViewed: () => void
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined)

function recentlyViewedReducer(
  state: RecentlyViewedState,
  action: RecentlyViewedAction,
): RecentlyViewedState {
  switch (action.type) {
    case 'SET':
      return { ids: action.payload }
    case 'ADD': {
      const nextIds = [action.payload, ...state.ids.filter((id) => id !== action.payload)]
      const limited = nextIds.slice(0, 12)
      return { ids: limited }
    }
    case 'CLEAR':
      return { ids: [] }
    default:
      return state
  }
}

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(recentlyViewedReducer, { ids: [] })

  const storageKey = user
    ? `projectx_recent_companies_${user.id}`
    : 'projectx_recent_companies_guest'

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const ids = parsed.filter((value) => typeof value === 'string')
        dispatch({ type: 'SET', payload: ids })
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.ids))
    } catch {
      // ignore
    }
  }, [storageKey, state.ids])

  const addRecentlyViewed = useCallback((companyId: string) => {
    dispatch({ type: 'ADD', payload: companyId })
  }, [])

  const clearRecentlyViewed = () => {
    dispatch({ type: 'CLEAR' })
  }

  const value: RecentlyViewedContextValue = {
    recentlyViewed: state.ids,
    addRecentlyViewed,
    clearRecentlyViewed,
  }

  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext)

  if (!ctx) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider')
  }

  return ctx
}
