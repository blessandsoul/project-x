import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '@/api/watchlist'

interface UseVehicleWatchlistReturn {
  /** Set of vehicle IDs currently in the watchlist */
  watchedIds: Set<number>
  /** Check if a vehicle is in the watchlist */
  isWatched: (vehicleId: number) => boolean
  /** Toggle a vehicle in/out of the watchlist */
  toggleWatch: (vehicleId: number) => Promise<void>
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Hook to manage vehicle watchlist with backend sync.
 * Requires user to be authenticated.
 */
export function useVehicleWatchlist(): UseVehicleWatchlistReturn {
  const { user, isAuthenticated } = useAuth()
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch watchlist on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setWatchedIds(new Set())
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    // Fetch all watchlist items (paginate if needed)
    const loadWatchlist = async () => {
      try {
        const response = await fetchWatchlist(1, 100) // Get up to 100 items (server max)
        if (!isMounted) return

        const ids = new Set(response.items.map((item) => item.id))
        setWatchedIds(ids)
      } catch (err) {
        if (!isMounted) return
        console.error('[useVehicleWatchlist] Failed to fetch watchlist:', err)
        setError('Failed to load watchlist')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadWatchlist()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user])

  const isWatched = useCallback(
    (vehicleId: number) => watchedIds.has(vehicleId),
    [watchedIds],
  )

  const toggleWatch = useCallback(
    async (vehicleId: number) => {
      if (!isAuthenticated) {
        // Could show a login prompt here
        console.warn('[useVehicleWatchlist] User not authenticated')
        return
      }

      const wasWatched = watchedIds.has(vehicleId)

      // Optimistic update
      setWatchedIds((prev) => {
        const next = new Set(prev)
        if (wasWatched) {
          next.delete(vehicleId)
        } else {
          next.add(vehicleId)
        }
        return next
      })

      try {
        if (wasWatched) {
          await removeFromWatchlist(vehicleId)
        } else {
          await addToWatchlist(vehicleId)
        }
      } catch (err) {
        // Revert optimistic update on error
        console.error('[useVehicleWatchlist] Failed to toggle watchlist:', err)
        setWatchedIds((prev) => {
          const next = new Set(prev)
          if (wasWatched) {
            next.add(vehicleId)
          } else {
            next.delete(vehicleId)
          }
          return next
        })
      }
    },
    [isAuthenticated, watchedIds],
  )

  return {
    watchedIds,
    isWatched,
    toggleWatch,
    isLoading,
    error,
  }
}
