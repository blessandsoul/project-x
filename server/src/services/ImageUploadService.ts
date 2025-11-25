import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Image Upload Service
 *
 * Centralized service for handling image uploads (avatars, logos, etc.)
 * Provides consistent image processing, resizing, and URL generation.
 */

export interface ImageUploadConfig {
  /** Base directory under uploads/ (e.g., 'users', 'companies') */
  category: string;
  /** Subdirectory identifier (e.g., username, company slug) */
  identifier: string;
  /** Subfolder name (e.g., 'avatars', 'logos') */
  subfolder: string;
  /** Base filename without extension (e.g., 'avatar', 'logo', or the slug) */
  baseName: string;
  /** Resize dimensions */
  size?: { width: number; height: number };
}

export interface ImageUrls {
  url: string | null;
  originalUrl: string | null;
}

export interface UploadResult {
  url: string;
  originalUrl: string;
  path: string;
  originalPath: string;
}

/**
 * Sanitize a string for use in file paths
 */
export function sanitizeForPath(input: string, allowUnderscore = false): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const pattern = allowUnderscore ? /[^a-z0-9_-]+/g : /[^a-z0-9-]+/g;

  return input
    .toLowerCase()
    .trim()
    .replace(pattern, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get the file extension from a MIME type
 */
export function getExtensionFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return 'jpg';
  }
  if (mime === 'image/webp') {
    return 'webp';
  }
  if (mime === 'image/gif') {
    return 'gif';
  }
  return 'png';
}

/**
 * Build a public URL for an uploaded file
 */
export function buildPublicUrl(relativePath: string): string {
  const baseUrl = process.env.PUBLIC_UPLOADS_BASE_URL;

  if (baseUrl && baseUrl.trim().length > 0) {
    return `${baseUrl.replace(/\/$/, '')}${relativePath}`;
  }

  return relativePath;
}

/**
 * Get the uploads directory path for a given config
 */
export function getUploadsPath(config: ImageUploadConfig): string {
  return path.join(
    process.cwd(),
    'uploads',
    config.category,
    config.identifier,
    config.subfolder,
  );
}

/**
 * Detect existing image extension in a directory
 */
export async function detectExistingExtension(
  uploadsPath: string,
  baseName: string,
): Promise<string | null> {
  try {
    const files = await fs.readdir(uploadsPath);
    const imageFile = files.find((f) => f.startsWith(`${baseName}.`));
    if (!imageFile) return null;

    const parts = imageFile.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Get URLs for existing images
 */
export async function getImageUrls(config: ImageUploadConfig): Promise<ImageUrls> {
  const uploadsPath = getUploadsPath(config);
  const ext = await detectExistingExtension(uploadsPath, config.baseName);

  if (!ext) {
    return { url: null, originalUrl: null };
  }

  const relativePath = `/uploads/${config.category}/${config.identifier}/${config.subfolder}`;
  const filename = `${config.baseName}.${ext}`;
  const originalFilename = `${config.baseName}-original.${ext}`;

  return {
    url: buildPublicUrl(`${relativePath}/${filename}`),
    originalUrl: buildPublicUrl(`${relativePath}/${originalFilename}`),
  };
}

/**
 * Process and save an uploaded image
 */
export async function processAndSaveImage(
  buffer: Buffer,
  mime: string,
  config: ImageUploadConfig,
): Promise<UploadResult> {
  const ext = getExtensionFromMime(mime);
  const uploadsPath = getUploadsPath(config);
  const size = config.size ?? { width: 256, height: 256 };

  // Ensure directory exists
  await fs.mkdir(uploadsPath, { recursive: true });

  // File paths
  const filename = `${config.baseName}.${ext}`;
  const originalFilename = `${config.baseName}-original.${ext}`;
  const filePath = path.join(uploadsPath, filename);
  const originalFilePath = path.join(uploadsPath, originalFilename);

  // Build sharp pipeline for resizing
  let pipeline = sharp(buffer).resize(size.width, size.height, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Apply format-specific optimizations
  if (ext === 'jpg') {
    pipeline = pipeline.jpeg({ quality: 90 });
  } else if (ext === 'webp') {
    pipeline = pipeline.webp({ quality: 90 });
  } else if (ext === 'gif') {
    pipeline = pipeline.gif();
  } else {
    pipeline = pipeline.png({ compressionLevel: 9 });
  }

  // Save both original and resized
  await Promise.all([
    fs.writeFile(originalFilePath, buffer),
    pipeline.toBuffer().then((resized) => fs.writeFile(filePath, resized)),
  ]);

  // Build public URLs
  const relativePath = `/uploads/${config.category}/${config.identifier}/${config.subfolder}`;

  return {
    url: buildPublicUrl(`${relativePath}/${filename}`),
    originalUrl: buildPublicUrl(`${relativePath}/${originalFilename}`),
    path: filePath,
    originalPath: originalFilePath,
  };
}

/**
 * Delete images for a given config
 */
export async function deleteImages(config: ImageUploadConfig): Promise<void> {
  const uploadsPath = getUploadsPath(config);

  try {
    const files = await fs.readdir(uploadsPath);
    const toDelete = files.filter(
      (f) => f.startsWith(`${config.baseName}.`) || f.startsWith(`${config.baseName}-original.`),
    );

    await Promise.all(
      toDelete.map((filename) =>
        fs.unlink(path.join(uploadsPath, filename)).catch(() => undefined),
      ),
    );
  } catch {
    // Directory doesn't exist or other error - treat as already deleted
  }
}

/**
 * Validate that a file is an image
 */
export function validateImageMime(mime: string | undefined): void {
  if (!mime || !mime.startsWith('image/')) {
    throw new Error('File must be an image');
  }
}

// =============================================================================
// Convenience functions for specific use cases
// =============================================================================

/**
 * Get user avatar configuration
 */
export function getUserAvatarConfig(username: string): ImageUploadConfig {
  const safeUsername = sanitizeForPath(username, true);
  return {
    category: 'users',
    identifier: safeUsername || 'unknown',
    subfolder: 'avatars',
    baseName: 'avatar',
    size: { width: 256, height: 256 },
  };
}

/**
 * Get company logo configuration
 */
export function getCompanyLogoConfig(slugOrName: string): ImageUploadConfig {
  const safeSlug = sanitizeForPath(slugOrName);
  return {
    category: 'companies',
    identifier: safeSlug || 'unknown',
    subfolder: 'logos',
    baseName: safeSlug || 'logo',
    size: { width: 256, height: 256 },
  };
}

/**
 * Get user avatar URLs
 */
export async function getUserAvatarUrls(username: string | null | undefined): Promise<ImageUrls> {
  if (!username || username.trim().length === 0) {
    return { url: null, originalUrl: null };
  }
  return getImageUrls(getUserAvatarConfig(username));
}

/**
 * Get company logo URLs
 */
export async function getCompanyLogoUrls(slugOrName: string | null | undefined): Promise<ImageUrls> {
  if (!slugOrName || slugOrName.trim().length === 0) {
    return { url: null, originalUrl: null };
  }
  return getImageUrls(getCompanyLogoConfig(slugOrName));
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  buffer: Buffer,
  mime: string,
  username: string,
): Promise<UploadResult> {
  validateImageMime(mime);
  return processAndSaveImage(buffer, mime, getUserAvatarConfig(username));
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(
  buffer: Buffer,
  mime: string,
  slugOrName: string,
): Promise<UploadResult> {
  validateImageMime(mime);
  return processAndSaveImage(buffer, mime, getCompanyLogoConfig(slugOrName));
}

/**
 * Delete user avatar
 */
export async function deleteUserAvatar(username: string): Promise<void> {
  return deleteImages(getUserAvatarConfig(username));
}

/**
 * Delete company logo
 */
export async function deleteCompanyLogo(slugOrName: string): Promise<void> {
  return deleteImages(getCompanyLogoConfig(slugOrName));
}
