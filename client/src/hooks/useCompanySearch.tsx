import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { mockSearchFilters } from '@/mocks/_mockData'
import type { SearchFilters } from '@/types/api'

interface SearchState {
  filters: SearchFilters
}

type SearchAction =
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'UPDATE_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'RESET_FILTERS' }

interface SearchContextValue {
  state: SearchState
  setFilters: (next: SearchFilters) => void
  updateFilters: (patch: Partial<SearchFilters>) => void
  resetFilters: () => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

const STORAGE_KEY = 'projectx_search_filters'

function loadInitialFilters(): SearchFilters {
  if (typeof window === 'undefined') {
    return mockSearchFilters
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return mockSearchFilters
    }

    const parsed = JSON.parse(raw) as Partial<SearchFilters>

    const geography = Array.isArray(parsed.geography)
      ? parsed.geography.filter((value): value is string => typeof value === 'string')
      : mockSearchFilters.geography

    const services = Array.isArray(parsed.services)
      ? parsed.services.filter((value): value is string => typeof value === 'string')
      : mockSearchFilters.services

    const priceRange = Array.isArray(parsed.priceRange) && parsed.priceRange.length === 2
      ? [
          typeof parsed.priceRange[0] === 'number' ? parsed.priceRange[0] : mockSearchFilters.priceRange[0],
          typeof parsed.priceRange[1] === 'number' ? parsed.priceRange[1] : mockSearchFilters.priceRange[1],
        ] as [number, number]
      : mockSearchFilters.priceRange

    const rating = typeof parsed.rating === 'number' ? parsed.rating : mockSearchFilters.rating

    const vipOnly = typeof parsed.vipOnly === 'boolean' ? parsed.vipOnly : mockSearchFilters.vipOnly

    return {
      geography,
      services,
      priceRange,
      rating,
      vipOnly,
    }
  } catch {
    return mockSearchFilters
  }
}

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      }
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      }
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: mockSearchFilters,
      }
    default:
      return state
  }
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    searchReducer,
    undefined,
    () => ({
      filters: loadInitialFilters(),
    }),
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters))
    } catch {
      // ignore
    }
  }, [state.filters])

  const setFilters = (next: SearchFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: next })
  }

  const updateFilters = (patch: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: patch })
  }

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' })
  }

  const value: SearchContextValue = {
    state,
    setFilters,
    updateFilters,
    resetFilters,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompanySearch(): SearchContextValue {
  const ctx = useContext(SearchContext)

  if (!ctx) {
    throw new Error('useCompanySearch must be used within a SearchProvider')
  }

  return ctx
}
