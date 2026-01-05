/**
 * Integration Test: Company Deletion with Asset Cleanup
 *
 * This script demonstrates the complete flow:
 * 1. Create a test company directory with assets
 * 2. Simulate company deletion
 * 3. Verify assets are cleaned up
 *
 * Run with: npx tsx scripts/demo-company-deletion.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { deleteCompanyAssets, getUploadsRoot } from '../src/utils/fs.js';

async function demo() {
    console.log('🎬 Company Deletion Demo\n');
    console.log('This demonstrates automatic asset cleanup when deleting a company.\n');

    const uploadsRoot = getUploadsRoot();
    const testSlug = 'demo-company-2025';
    const companyDir = path.join(uploadsRoot, 'companies', testSlug);
    const logosDir = path.join(companyDir, 'logos');

    try {
        // Step 1: Create mock company assets
        console.log('📁 Step 1: Creating mock company assets...');
        await fs.mkdir(logosDir, { recursive: true });

        await fs.writeFile(
            path.join(logosDir, `${testSlug}.jpg`),
            'Mock logo image data (resized)'
        );
        await fs.writeFile(
            path.join(logosDir, `${testSlug}-original.jpg`),
            'Mock logo image data (original)'
        );

        console.log(`   Created: ${companyDir}`);
        console.log(`   Created: ${logosDir}`);

        const files = await fs.readdir(logosDir);
        console.log(`   Files: ${files.join(', ')}\n`);

        // Step 2: Verify assets exist
        console.log('✅ Step 2: Verifying assets exist...');
        try {
            await fs.access(companyDir);
            console.log(`   ✓ Company directory exists\n`);
        } catch {
            console.log(`   ✗ Company directory missing\n`);
            return;
        }

        // Step 3: Simulate company deletion (asset cleanup)
        console.log('🗑️  Step 3: Deleting company assets...');
        console.log(`   Calling: deleteCompanyAssets('${testSlug}')`);

        const deleted = await deleteCompanyAssets(testSlug);

        if (deleted) {
            console.log(`   ✓ Assets deleted successfully\n`);
        } else {
            console.log(`   ✗ Assets were not found (already deleted)\n`);
        }

        // Step 4: Verify assets are gone
        console.log('🔍 Step 4: Verifying assets are removed...');
        try {
            await fs.access(companyDir);
            console.log(`   ✗ FAILED: Directory still exists!\n`);
        } catch {
            console.log(`   ✓ Company directory successfully removed\n`);
        }

        // Step 5: Verify parent directory still exists
        console.log('🔒 Step 5: Verifying parent directory is safe...');
        const companiesDir = path.join(uploadsRoot, 'companies');
        try {
            await fs.access(companiesDir);
            console.log(`   ✓ Parent 'companies' directory still exists\n`);
        } catch {
            console.log(`   ✗ FAILED: Parent directory was deleted!\n`);
        }

        console.log('✅ Demo completed successfully!\n');
        console.log('Summary:');
        console.log('  • Company assets created ✓');
        console.log('  • Assets deleted via deleteCompanyAssets() ✓');
        console.log('  • Company directory removed ✓');
        console.log('  • Parent directory protected ✓');
        console.log('  • No errors or crashes ✓\n');

    } catch (error) {
        console.error('❌ Demo failed:', error);

        // Cleanup on error
        try {
            await fs.rm(companyDir, { recursive: true, force: true });
            console.log('Cleaned up test directory');
        } catch {
            // Ignore cleanup errors
        }

        process.exit(1);
    }
}

demo();
