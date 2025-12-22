/**
 * Test script for company asset deletion
 *
 * This script verifies that:
 * 1. safeRmrf prevents path traversal
 * 2. safeRmrf prevents deletion of uploads root
 * 3. deleteCompanyAssets works correctly
 * 4. Missing directories are handled gracefully
 *
 * Run with: npx tsx scripts/test-company-asset-deletion.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { safeRmrf, deleteCompanyAssets, getUploadsRoot } from '../src/utils/fs.js';

async function runTests() {
    console.log('🧪 Testing Company Asset Deletion\n');

    const uploadsRoot = getUploadsRoot();
    console.log(`Uploads root: ${uploadsRoot}\n`);

    // Test 1: Path traversal prevention
    console.log('Test 1: Path traversal prevention');
    try {
        await safeRmrf('../../etc/passwd');
        console.log('❌ FAILED: Should have thrown error for path traversal');
    } catch (error) {
        if (error instanceof Error && error.message.includes('path traversal')) {
            console.log('✅ PASSED: Path traversal blocked\n');
        } else {
            console.log(`❌ FAILED: Wrong error: ${error}\n`);
        }
    }

    // Test 2: Prevent deletion of uploads root
    console.log('Test 2: Prevent deletion of uploads root');
    try {
        await safeRmrf(uploadsRoot);
        console.log('❌ FAILED: Should have thrown error for root deletion');
    } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot delete uploads root')) {
            console.log('✅ PASSED: Uploads root deletion blocked\n');
        } else {
            console.log(`❌ FAILED: Wrong error: ${error}\n`);
        }
    }

    // Test 3: Create and delete test company assets
    console.log('Test 3: Create and delete test company assets');
    const testSlug = 'test-company-delete-me';
    const testCompanyDir = path.join(uploadsRoot, 'companies', testSlug);
    const testLogoDir = path.join(testCompanyDir, 'logos');

    try {
        // Create test directory structure
        await fs.mkdir(testLogoDir, { recursive: true });
        await fs.writeFile(path.join(testLogoDir, 'logo.jpg'), 'fake logo data');
        await fs.writeFile(path.join(testLogoDir, 'logo-original.jpg'), 'fake original logo');
        console.log(`Created test company directory: ${testCompanyDir}`);

        // Verify files exist
        const filesBefore = await fs.readdir(testLogoDir);
        console.log(`Files before deletion: ${filesBefore.join(', ')}`);

        // Delete using our function
        const deleted = await deleteCompanyAssets(testSlug);
        console.log(`Deletion result: ${deleted}`);

        // Verify directory is gone
        try {
            await fs.access(testCompanyDir);
            console.log('❌ FAILED: Directory still exists after deletion\n');
        } catch {
            console.log('✅ PASSED: Company assets deleted successfully\n');
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error}\n`);
    }

    // Test 4: Handle missing directory gracefully
    console.log('Test 4: Handle missing directory gracefully');
    try {
        const deleted = await deleteCompanyAssets('non-existent-company');
        if (deleted === false) {
            console.log('✅ PASSED: Missing directory handled gracefully\n');
        } else {
            console.log('❌ FAILED: Should return false for missing directory\n');
        }
    } catch (error) {
        console.log(`❌ FAILED: Should not throw for missing directory: ${error}\n`);
    }

    // Test 5: Empty slug handling
    console.log('Test 5: Empty slug handling');
    try {
        const deleted = await deleteCompanyAssets('');
        if (deleted === false) {
            console.log('✅ PASSED: Empty slug handled gracefully\n');
        } else {
            console.log('❌ FAILED: Should return false for empty slug\n');
        }
    } catch (error) {
        console.log(`❌ FAILED: Should not throw for empty slug: ${error}\n`);
    }

    console.log('✅ All tests completed!');
}

runTests().catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
});
