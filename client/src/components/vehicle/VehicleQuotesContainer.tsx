import { memo } from 'react'
import { useVehicleQuotesPagination } from '@/hooks/useVehicleQuotesPagination'
import VehicleQuotesSection from './VehicleQuotesSection'
import type { VehicleQuote } from '@/types/vehicles'

interface VehicleQuotesContainerProps {
    vehicleId: number
    auction: string
    usacity: string
    vehiclecategory?: 'Sedan' | 'Bike'
    priceAvailable: boolean
    priceUnavailableMessage: string | null
    onOpenBreakdown: (quote: VehicleQuote) => void
    onOpenLeadModal: () => void
}

/**
 * Container component for vehicle quotes section with pagination.
 * Memoized to prevent re-renders when parent page updates.
 * Manages its own pagination state via useVehicleQuotesPagination hook.
 */
const VehicleQuotesContainer = memo(({
    vehicleId,
    auction,
    usacity,
    vehiclecategory,
    priceAvailable,
    priceUnavailableMessage,
    onOpenBreakdown,
    onOpenLeadModal,
}: VehicleQuotesContainerProps) => {
    // TEMPORARY DEBUG: Track renders
    console.count('VehicleQuotesContainer render')

    const {
        quotes,
        total,
        totalPages,
        currentPage,
        isLoading,
        error,
        setPage,
        priceStats,
    } = useVehicleQuotesPagination({
        vehicleId,
        auction,
        usacity,
        limit: 5,
        vehiclecategory,
    })

    return (
        <VehicleQuotesSection
            filteredQuotes={quotes}
            priceStats={priceStats}
            error={error}
            isLoading={isLoading}
            priceAvailable={priceAvailable}
            priceUnavailableMessage={priceUnavailableMessage}
            onOpenBreakdown={onOpenBreakdown}
            onOpenLeadModal={onOpenLeadModal}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
        />
    )
})

VehicleQuotesContainer.displayName = 'VehicleQuotesContainer'

export default VehicleQuotesContainer
