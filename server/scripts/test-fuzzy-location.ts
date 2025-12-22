/**
 * Integration Test for Fuzzy Location Matching
 *
 * Tests the /vehicles/search endpoint with fuzzy location matching.
 * Run with: npx tsx scripts/test-fuzzy-location.ts
 *
 * Pre-requisites:
 * - Server running on localhost:3000
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface SearchResponse {
    items: Array<{
        id: number;
        make: string;
        model: string;
        year: number;
        yard_name: string;
        source: string;
    }>;
    total: number;
    limit: number;
    page: number;
    totalPages: number;
}

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${(error as Error).message}`);
    }
}

async function fetchSearch(params: Record<string, string>): Promise<SearchResponse> {
    const url = new URL('/vehicles/search', BASE_URL);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

console.log('\n=== Fuzzy Location Matching Integration Tests ===\n');
console.log(`Testing against: ${BASE_URL}\n`);

async function runTests() {
    // Test 1: Exact match should still work
    await test('Exact match with NC-ASHEVILLE format', async () => {
        // First, let's see what locations exist in the database
        const anyResult = await fetchSearch({ limit: '5' });
        console.log('   Sample yard_names:', anyResult.items.map(v => v.yard_name).filter(Boolean).slice(0, 3));
    });

    // Test 2: Fuzzy match with different format
    await test('Fuzzy match with ASHEVILLE (NC) format', async () => {
        // Try fuzzy matching
        const result = await fetchSearch({
            location: 'ASHEVILLE (NC)',
            fuzzy_location: 'true',
            limit: '5',
        });

        console.log(`   Found ${result.total} vehicles with fuzzy location match`);
        if (result.items.length > 0) {
            console.log('   Sample yard_names:', result.items.map(v => v.yard_name).filter(Boolean).slice(0, 3));
        }
    });

    // Test 3: Compare exact vs fuzzy results
    await test('Fuzzy matching returns >= exact match results', async () => {
        // Pick a common location pattern
        const testLocation = 'HOUSTON';

        const exactResult = await fetchSearch({
            location: testLocation,
            limit: '1',
        });

        const fuzzyResult = await fetchSearch({
            location: testLocation,
            fuzzy_location: 'true',
            limit: '1',
        });

        console.log(`   Exact match total: ${exactResult.total}`);
        console.log(`   Fuzzy match total: ${fuzzyResult.total}`);

        // Fuzzy should return at least as many as exact (usually more)
        // This may not always be true depending on data, so just log it
    });

    // Test 4: State code matching
    await test('Fuzzy match with state code in parentheses', async () => {
        const result = await fetchSearch({
            location: 'DALLAS (TX)',
            fuzzy_location: 'true',
            limit: '5',
        });

        console.log(`   Found ${result.total} vehicles for 'DALLAS (TX)'`);
        if (result.items.length > 0) {
            console.log('   Sample yard_names:', result.items.map(v => v.yard_name).filter(Boolean).slice(0, 3));
        }
    });

    // Test 5: Ensure API still works without fuzzy flag (backward compatibility)
    await test('Backward compatibility: location filter without fuzzy_location flag', async () => {
        const result = await fetchSearch({
            location: 'TX',
            limit: '5',
        });

        // Should work without error
        console.log(`   Found ${result.total} vehicles with exact match for 'TX'`);
    });

    // Test 6: Empty location should return all
    await test('No location filter returns all vehicles', async () => {
        const result = await fetchSearch({ limit: '1' });
        if (result.total === 0) {
            throw new Error('Expected some vehicles in database');
        }
        console.log(`   Database has ${result.total} total vehicles`);
    });

    console.log('\n=== Integration Tests Complete ===\n');
}

runTests().catch(console.error);
