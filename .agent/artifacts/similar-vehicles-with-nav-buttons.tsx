// COMPLETE UPDATED SimilarVehicles COMPONENT
// Replace the entire SimilarVehicles component (lines 525-621) with this:

const SimilarVehicles = ({ baseVehicleId }: { baseVehicleId: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { isWatched, toggleWatch } = useVehicleWatchlist()
    const [similarItems, setSimilarItems] = useState<VehicleSearchItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const shouldReduceMotion = useReducedMotion()

    // Scroll container ref for navigation buttons
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let isMounted = true

        const run = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetchSimilarVehicles(baseVehicleId, { limit: 20 })
                if (!isMounted) return
                const items = Array.isArray(response.items) ? response.items : []
                // Cap to a maximum of 10 similar vehicles to keep the strip compact
                setSimilarItems(items.slice(0, 10))
            } catch (err) {
                if (!isMounted) return
                const message = err instanceof Error ? err.message : 'Failed to load similar vehicles'
                setError(message)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        run()

        return () => {
            isMounted = false
        }
    }, [baseVehicleId])

    const handleToggleWatch = useCallback((vehicleId: number) => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        toggleWatch(vehicleId)
    }, [isAuthenticated, navigate, toggleWatch])

    // Scroll function for navigation buttons
    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const scrollAmount = direction === 'left' ? -400 : 400
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }

    // Note: Desktop autoplay removed to avoid unexpected jumping/scrolling

    if (isLoading) {
        return (
            <section className="space-y-4 pt-8 border-t">
                <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl hidden sm:block" />
                    <Skeleton className="h-64 rounded-xl hidden sm:block" />
                </div>
            </section>
        )
    }

    if (error || !similarItems.length) {
        return null
    }

    return (
        <motion.section
            className="similar-vehicles-section space-y-4 pt-8 border-t overflow-hidden"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('vehicle.similar.title')}</h2>
            </div>

            {/* Horizontal scrolling carousel with navigation buttons */}
            <div className="relative">
                {/* Left Navigation Button */}
                <button
                    onClick={() => scroll('left')}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
                    aria-label="Scroll left"
                >
                    <Icon icon="mdi:chevron-left" className="w-6 h-6 text-slate-700" />
                </button>

                {/* Right Navigation Button */}
                <button
                    onClick={() => scroll('right')}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
                    aria-label="Scroll right"
                >
                    <Icon icon="mdi:chevron-right" className="w-6 h-6 text-slate-700" />
                </button>

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
                >
                    {similarItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-[240px] min-[460px]:w-[280px] min-[500px]:w-[340px] sm:w-[380px] md:w-[420px] lg:w-[400px] snap-start">
                            <SimilarVehicleCard
                                item={item}
                                priority={false}
                                onViewDetails={() => navigate({ pathname: `/vehicle/${item.id}` })}
                                onToggleWatch={() => handleToggleWatch(item.id)}
                                isWatched={isWatched(item.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </motion.section>
    )
}
