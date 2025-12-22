import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePageParam } from './useQueryParamState'
import { calculateVehicleQuotes } from '@/api/vehicles'
import type { VehicleQuote } from '@/types/vehicles'

interface UseVehicleQuotesPaginationOptions {
    vehicleId: number | null
    auction: string
    usacity: string
    limit?: number
    vehiclecategory?: 'Sedan' | 'Bike'
}

interface UseVehicleQuotesPaginationResult {
    quotes: VehicleQuote[]
    total: number
    totalPages: number
    currentPage: number
    isLoading: boolean
    error: string | null
    setPage: (page: number) => void
    priceStats: { min: number; max: number; avg: number }
}

/**
 * Hook for managing paginated vehicle quotes with URL sync via History API.
 * Uses History API directly (not React Router) to prevent route-level re-renders.
 */
export function useVehicleQuotesPagination({
    vehicleId,
    auction,
    usacity,
    limit = 5,
    vehiclecategory,
}: UseVehicleQuotesPaginationOptions): UseVehicleQuotesPaginationResult {
    // Use History API-based page param (NOT React Router)
    const [currentPage, setPageParam] = usePageParam('quotesPage')

    // Track previous vehicleId to reset page on vehicle change
    const prevVehicleIdRef = useRef<number | null>(null)

    // Local state for quotes data
    const [quotesData, setQuotesData] = useState<{
        quotes: VehicleQuote[]
        total: number
        totalPages: number
        isLoading: boolean
        error: string | null
    }>({
        quotes: [],
        total: 0,
        totalPages: 1,
        isLoading: false,
        error: null,
    })

    // Reset page to 1 when vehicleId changes (separate effect, no setPageParam dep)
    useEffect(() => {
        if (prevVehicleIdRef.current !== null && prevVehicleIdRef.current !== vehicleId) {
            // Reset to page 1 on vehicle change, but don't add setPageParam to deps
            setPageParam(1)
        }
        prevVehicleIdRef.current = vehicleId
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleId]) // Intentionally exclude setPageParam - it's stable

    // Fetch quotes when vehicleId, page, or location changes
    useEffect(() => {
        if (!vehicleId || !auction || !usacity) {
            setQuotesData({
                quotes: [],
                total: 0,
                totalPages: 1,
                isLoading: false,
                error: null,
            })
            return
        }

        let isMounted = true
        const offset = (currentPage - 1) * limit

        const fetchQuotes = async () => {
            setQuotesData(prev => ({ ...prev, isLoading: true, error: null }))

            try {
                const response = await calculateVehicleQuotes(
                    vehicleId,
                    auction,
                    usacity,
                    'usd',
                    { limit, offset, ...(vehiclecategory && { vehiclecategory }) }
                )

                if (!isMounted) return

                const totalPages = response.totalPages || 1

                // Clamp page if user typed a huge number - but only if we have valid data
                if (currentPage > totalPages && totalPages > 0) {
                    setPageParam(totalPages)
                    return // Will refetch with correct page
                }

                setQuotesData({
                    quotes: response.quotes || [],
                    total: response.total || 0,
                    totalPages,
                    isLoading: false,
                    error: null,
                })
            } catch (err) {
                if (!isMounted) return
                console.error('Failed to fetch paginated quotes:', err)
                setQuotesData({
                    quotes: [],
                    total: 0,
                    totalPages: 1,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Failed to load quotes',
                })
            }
        }

        fetchQuotes()

        return () => {
            isMounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleId, auction, usacity, currentPage, limit, vehiclecategory]) // Exclude setPageParam - only used for clamping

    // Handler to change page
    const setPage = useCallback((newPage: number) => {
        const clampedPage = Math.max(1, newPage)
        setPageParam(clampedPage)
    }, [setPageParam])

    // Compute price stats from current quotes
    const priceStats = useMemo(() => {
        if (!quotesData.quotes.length) return { min: 0, max: 0, avg: 0 }
        const prices = quotesData.quotes.map(q => Number(q.total_price) || 0).filter(p => p > 0)
        if (!prices.length) return { min: 0, max: 0, avg: 0 }
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        }
    }, [quotesData.quotes])

    return {
        quotes: quotesData.quotes,
        total: quotesData.total,
        totalPages: quotesData.totalPages,
        currentPage,
        isLoading: quotesData.isLoading,
        error: quotesData.error,
        setPage,
        priceStats,
    }
}
