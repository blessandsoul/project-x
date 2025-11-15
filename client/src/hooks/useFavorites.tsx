import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface FavoritesState {
  ids: string[]
}

type FavoritesAction =
  | { type: 'SET'; payload: string[] }
  | { type: 'TOGGLE'; payload: string }
  | { type: 'CLEAR' }

interface FavoritesContextValue {
  favorites: string[]
  toggleFavorite: (companyId: string) => void
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'SET':
      return { ids: action.payload }
    case 'TOGGLE': {
      const exists = state.ids.includes(action.payload)
      return {
        ids: exists ? state.ids.filter((id) => id !== action.payload) : [...state.ids, action.payload],
      }
    }
    case 'CLEAR':
      return { ids: [] }
    default:
      return state
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(favoritesReducer, { ids: [] })

  const storageKey = user
    ? `projectx_favorite_companies_${user.id}`
    : 'projectx_favorite_companies_guest'

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

  const toggleFavorite = (companyId: string) => {
    dispatch({ type: 'TOGGLE', payload: companyId })
  }

  const clearFavorites = () => {
    dispatch({ type: 'CLEAR' })
  }

  const value: FavoritesContextValue = {
    favorites: state.ids,
    toggleFavorite,
    clearFavorites,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)

  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }

  return ctx
}
