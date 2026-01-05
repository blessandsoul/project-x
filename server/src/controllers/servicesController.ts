import { FastifyInstance } from 'fastify';
import { ServicesModel } from '../models/ServicesModel.js';

/**
 * ServicesController
 *
 * Handles services API requests.
 * Provides endpoint to retrieve active services for company onboarding.
 */
export class ServicesController {
    private fastify: FastifyInstance;
    private model: ServicesModel;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
        this.model = new ServicesModel(fastify);
    }

    /**
     * Get all active services
     * @returns Array of services with id and name
     */
    async getActiveServices(): Promise<Array<{ id: number; name: string }>> {
        return await this.model.getActiveServices();
    }
}
