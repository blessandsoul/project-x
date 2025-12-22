import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom event name for URL changes via History API
 * (popstate only fires on back/forward, not on pushState/replaceState)
 */
const URL_CHANGE_EVENT = 'urlchange'

/**
 * Get a query parameter value from the current URL
 */
function getQueryParam(name: string): string | null {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get(name)
}

/**
 * Set a query parameter in the URL using History API (no React Router)
 */
function setQueryParam(
    name: string,
    value: string | null,
    mode: 'replace' | 'push' = 'replace'
): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)

    if (value === null || value === '') {
        url.searchParams.delete(name)
    } else {
        url.searchParams.set(name, value)
    }

    const newUrl = url.pathname + url.search + url.hash

    if (mode === 'push') {
        window.history.pushState({ [name]: value }, '', newUrl)
    } else {
        window.history.replaceState({ [name]: value }, '', newUrl)
    }

    // Dispatch custom event since replaceState/pushState don't trigger popstate
    window.dispatchEvent(new CustomEvent(URL_CHANGE_EVENT, { detail: { name, value } }))
}

/**
 * Hook to sync a numeric page parameter with URL using History API.
 * Does NOT use React Router, so changing the param won't trigger route re-renders.
 * 
 * @param name - Query parameter name (default: 'page')
 * @returns [currentPage, setPage] tuple
 */
export function usePageParam(name: string = 'page'): [number, (page: number) => void] {
    // Parse page from URL
    const getPageFromUrl = useCallback((): number => {
        const raw = getQueryParam(name)
        if (raw === null) return 1
        const num = parseInt(raw, 10)
        return isNaN(num) || num < 1 ? 1 : num
    }, [name])

    const [page, setPageState] = useState<number>(getPageFromUrl)

    // Track if we triggered the URL change (to avoid reacting to our own changes)
    const isInternalChange = useRef(false)

    // Update URL and state
    const setPage = useCallback((newPage: number) => {
        const clampedPage = Math.max(1, newPage)
        setPageState(clampedPage)
        isInternalChange.current = true
        // Remove param if page is 1 (clean URL)
        const serialized = clampedPage <= 1 ? null : String(clampedPage)
        setQueryParam(name, serialized, 'replace')
    }, [name])

    // Listen for URL changes (popstate for back/forward)
    useEffect(() => {
        const handlePopState = () => {
            // popstate is only from browser back/forward, always update
            const newPage = getPageFromUrl()
            setPageState(newPage)
        }

        const handleUrlChange = (event: Event) => {
            // Skip if we triggered this change
            if (isInternalChange.current) {
                isInternalChange.current = false
                return
            }
            // Only react if this event is for our param
            const detail = (event as CustomEvent).detail
            if (detail?.name === name) {
                const newPage = getPageFromUrl()
                setPageState(newPage)
            }
        }

        window.addEventListener('popstate', handlePopState)
        window.addEventListener(URL_CHANGE_EVENT, handleUrlChange)

        return () => {
            window.removeEventListener('popstate', handlePopState)
            window.removeEventListener(URL_CHANGE_EVENT, handleUrlChange)
        }
    }, [name, getPageFromUrl])

    return [page, setPage]
}
