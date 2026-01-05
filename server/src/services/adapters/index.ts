/**
 * Calculator Adapters
 * 
 * This module exports all calculator adapter classes and types for use
 * throughout the application.
 * 
 * @example
 * ```typescript
 * import { CalculatorAdapterFactory, DefaultAdapter } from './adapters';
 * 
 * const factory = new CalculatorAdapterFactory(fastify);
 * const adapter = factory.getAdapter(company);
 * const result = await adapter.calculate(request, company);
 * ```
 */

// Adapter classes
export { DefaultAdapter } from './DefaultAdapter.js';
export { ConfigurableAdapter } from './ConfigurableAdapter.js';
export { CalculatorAdapterFactory } from './CalculatorAdapterFactory.js';

// Types and interfaces
export type {
    ICalculatorAdapter,
    StandardCalculatorRequest,
    StandardCalculatorResponse,
    CalculatorConfig,
    CalculatorType,
    RequestFieldMapping,
    ResponseFieldMapping,
} from './ICalculatorAdapter.js';
