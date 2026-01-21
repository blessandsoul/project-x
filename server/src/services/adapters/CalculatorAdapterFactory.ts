import { FastifyInstance } from 'fastify';
import type { Company } from '../../types/company.js';
import type { ICalculatorAdapter, CalculatorType } from './ICalculatorAdapter.js';
import { DefaultAdapter } from './DefaultAdapter.js';
import { ConfigurableAdapter } from './ConfigurableAdapter.js';
import { FakeCalculatorAdapter } from './FakeCalculatorAdapter.js'; // ⚠️ FAKE - Remove in production

/**
 * Calculator Adapter Factory
 * 
 * Returns the appropriate calculator adapter based on company configuration.
 * This factory implements the Strategy Pattern, allowing different companies
 * to use different calculator APIs without changing the calling code.
 * 
 * @example
 * ```typescript
 * const factory = new CalculatorAdapterFactory(fastify);
 * const adapter = factory.getAdapter(company);
 * const result = await adapter.calculate(request, company);
 * ```
 */
export class CalculatorAdapterFactory {
    private readonly fastify: FastifyInstance;

    // Singleton instances for adapters (they're stateless, so we can reuse)
    private defaultAdapter: DefaultAdapter | null = null;
    private configurableAdapter: ConfigurableAdapter | null = null;
    private fakeAdapter: FakeCalculatorAdapter | null = null; // ⚠️ FAKE - Remove in production

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Get the appropriate calculator adapter for a company.
     * 
     * @param company - Company with calculator configuration
     * @returns Calculator adapter instance
     */
    getAdapter(company: Company): ICalculatorAdapter {
        const calculatorType = (company as any).calculator_type as CalculatorType | undefined;

        switch (calculatorType) {
            case 'custom_api':
                return this.getConfigurableAdapter();

            case 'fake':
                // ⚠️ FAKE CALCULATOR - Development only, remove in production
                return this.getFakeAdapter();

            case 'formula':
                // Formula-based calculation - for now, fall back to default
                // TODO: Implement FormulaAdapter if needed
                this.fastify.log.warn(
                    { companyId: company.id, calculatorType },
                    '[CalculatorAdapterFactory] Formula adapter not implemented, using default'
                );
                return this.getDefaultAdapter();

            case 'default':
            default:
                // Default: Use Auto Market Logistic calculator
                return this.getDefaultAdapter();
        }
    }

    /**
     * Get or create the default adapter (singleton).
     */
    private getDefaultAdapter(): DefaultAdapter {
        if (!this.defaultAdapter) {
            this.defaultAdapter = new DefaultAdapter(this.fastify);
        }
        return this.defaultAdapter;
    }

    /**
     * Get or create the configurable adapter (singleton).
     */
    private getConfigurableAdapter(): ConfigurableAdapter {
        if (!this.configurableAdapter) {
            this.configurableAdapter = new ConfigurableAdapter(this.fastify);
        }
        return this.configurableAdapter;
    }

    /**
     * Get or create the fake adapter (singleton).
     * ⚠️ FAKE - Remove in production
     */
    private getFakeAdapter(): FakeCalculatorAdapter {
        if (!this.fakeAdapter) {
            this.fakeAdapter = new FakeCalculatorAdapter(this.fastify);
        }
        return this.fakeAdapter;
    }
}
