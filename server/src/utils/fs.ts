import fs from 'fs/promises';
import path from 'path';

/**
 * Filesystem Utilities
 *
 * Provides safe filesystem operations with path traversal prevention.
 */

/**
 * Get the absolute path to the uploads directory
 */
export function getUploadsRoot(): string {
    return path.join(process.cwd(), 'uploads');
}

/**
 * Safely delete a directory or file with path traversal protection
 *
 * Security features:
 * - Resolves absolute path
 * - Ensures target is inside uploads root
 * - Prevents deletion of uploads root itself
 * - Handles missing paths gracefully
 *
 * @param targetPath - Relative or absolute path to delete
 * @returns true if deleted, false if path didn't exist
 * @throws Error if path is outside uploads root or is the root itself
 */
export async function safeRmrf(targetPath: string): Promise<boolean> {
    const uploadsRoot = getUploadsRoot();

    // Resolve to absolute path
    const absoluteTarget = path.isAbsolute(targetPath)
        ? path.resolve(targetPath)
        : path.resolve(uploadsRoot, targetPath);

    // Normalize both paths for comparison
    const normalizedTarget = path.normalize(absoluteTarget);
    const normalizedRoot = path.normalize(uploadsRoot);

    // Security: Prevent deletion of uploads root itself
    if (normalizedTarget === normalizedRoot) {
        throw new Error('Cannot delete uploads root directory');
    }

    // Security: Ensure target is inside uploads root (prevent path traversal)
    if (!normalizedTarget.startsWith(normalizedRoot + path.sep)) {
        throw new Error(`Path traversal detected: ${targetPath} is outside uploads directory`);
    }

    // Check if path exists
    try {
        await fs.access(normalizedTarget);
    } catch {
        // Path doesn't exist - treat as already deleted
        console.log(`[safeRmrf] Path does not exist (already deleted): ${normalizedTarget}`);
        return false;
    }

    // Delete the path
    try {
        await fs.rm(normalizedTarget, { recursive: true, force: true });
        console.log(`[safeRmrf] Successfully deleted: ${normalizedTarget}`);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[safeRmrf] Failed to delete ${normalizedTarget}: ${message}`);
        throw new Error(`Failed to delete ${targetPath}: ${message}`);
    }
}

/**
 * Delete all assets for a company
 *
 * Deletes the entire company directory under uploads/companies/{slug}
 *
 * @param companySlug - Company slug (sanitized identifier)
 * @returns true if deleted, false if didn't exist
 */
export async function deleteCompanyAssets(companySlug: string): Promise<boolean> {
    if (!companySlug || companySlug.trim().length === 0) {
        console.warn('[deleteCompanyAssets] Empty slug provided, skipping deletion');
        return false;
    }

    const companyDir = path.join('companies', companySlug);

    try {
        return await safeRmrf(companyDir);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[deleteCompanyAssets] Error deleting assets for company ${companySlug}: ${message}`);
        // Re-throw to let caller handle
        throw error;
    }
}

/**
 * Check if a path exists
 */
export async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}
