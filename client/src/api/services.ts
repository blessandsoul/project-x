/**
 * Services API Client
 *
 * Fetches available services for company onboarding from the server.
 * Services are stored case-sensitively and displayed exactly as returned.
 */

import { apiGet } from '@/lib/apiClient';

/**
 * Service entity returned from API
 */
export interface Service {
    id: number;
    name: string;
}

/**
 * API response format for services endpoint
 */
interface ServicesResponse {
    success: boolean;
    count: number;
    data: Service[];
}

/**
 * Fetch all available services for company onboarding.
 * Services are returned ordered by sort_order, then name.
 *
 * @returns Array of services with id and name, or empty array on error
 */
export async function fetchServices(): Promise<Service[]> {
    try {
        const response = await apiGet<ServicesResponse>('/api/services');

        if (response.success) {
            return response.data;
        }

        return [];
    } catch (error) {
        console.error('[services] Failed to fetch services:', error);
        return [];
    }
}
