import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Image Upload Service
 *
 * Centralized service for handling image uploads (avatars, logos, etc.)
 * Provides consistent image processing, resizing, and URL generation.
 *
 * Security features:
 * - Magic byte validation (not just MIME header)
 * - Strict allowlist of image types
 * - Image sanitization via sharp (re-encode, strip metadata)
 * - Size limits enforced
 * - Path traversal prevention
 */

// =============================================================================
// Security: File validation constants
// =============================================================================

/** Maximum avatar file size in bytes (2 MB) */
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/** Maximum image dimensions for avatars */
export const MAX_AVATAR_DIMENSIONS = { width: 512, height: 512 };

/** Allowed MIME types for avatar uploads */
export const ALLOWED_AVATAR_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/** Magic byte signatures for allowed image types */
const IMAGE_SIGNATURES: Array<{ mime: string; signature: number[]; offset?: number }> = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WEBP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { mime: 'image/webp', signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
];

/** WEBP secondary signature at offset 8 */
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

export interface ValidatedImage {
  buffer: Buffer;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  ext: 'jpg' | 'png' | 'webp';
}

/**
 * Validate file magic bytes against known image signatures
 * Returns the detected MIME type or null if not a valid image
 */
export function detectImageTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) {
    return null;
  }

  for (const { mime, signature, offset = 0 } of IMAGE_SIGNATURES) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[offset + i] !== signature[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Special case for WEBP: also check bytes 8-11
      if (mime === 'image/webp') {
        let webpMatches = true;
        for (let i = 0; i < WEBP_SIGNATURE.length; i++) {
          if (buffer[8 + i] !== WEBP_SIGNATURE[i]) {
            webpMatches = false;
            break;
          }
        }
        if (!webpMatches) {
          continue; // Not actually WEBP, might be other RIFF format
        }
      }
      return mime;
    }
  }

  return null;
}

/**
 * Validate and sanitize an avatar upload
 *
 * Security checks:
 * 1. Size limit (2 MB)
 * 2. MIME type allowlist
 * 3. Magic byte verification (prevents polyglots)
 * 4. Re-encode via sharp (strips metadata, ensures valid image)
 *
 * @param buffer - Raw uploaded file buffer
 * @param declaredMime - MIME type declared by client (not trusted)
 * @returns Sanitized image buffer with verified type
 * @throws Error if validation fails
 */
export async function validateAndSanitizeAvatarUpload(
  buffer: Buffer,
  declaredMime: string | undefined,
): Promise<ValidatedImage> {
  // 1. Check size limit
  if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_AVATAR_SIZE_BYTES / 1024 / 1024} MB`);
  }

  if (buffer.length === 0) {
    throw new Error('File is empty');
  }

  // 2. Detect actual type from magic bytes (don't trust declared MIME)
  const detectedMime = detectImageTypeFromBuffer(buffer);

  if (!detectedMime) {
    throw new Error('Invalid image file. Could not detect image type from file signature');
  }

  // 3. Check against allowlist
  if (!ALLOWED_AVATAR_MIMES.has(detectedMime)) {
    throw new Error(`Image type not allowed. Allowed types: JPEG, PNG, WEBP`);
  }

  // 4. Sanitize via sharp: decode and re-encode to strip metadata and ensure valid image
  let sanitizedBuffer: Buffer;
  let outputMime: 'image/jpeg' | 'image/png' | 'image/webp';
  let outputExt: 'jpg' | 'png' | 'webp';

  try {
    // Load image with sharp - this will fail if the file is not a valid image
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Validate dimensions are reasonable
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image dimensions');
    }

    // Resize if larger than max dimensions, maintaining aspect ratio
    let pipeline = image.resize(MAX_AVATAR_DIMENSIONS.width, MAX_AVATAR_DIMENSIONS.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Re-encode to the detected format (strips metadata)
    if (detectedMime === 'image/jpeg') {
      pipeline = pipeline.jpeg({ quality: 90 });
      outputMime = 'image/jpeg';
      outputExt = 'jpg';
    } else if (detectedMime === 'image/webp') {
      pipeline = pipeline.webp({ quality: 90 });
      outputMime = 'image/webp';
      outputExt = 'webp';
    } else {
      // PNG
      pipeline = pipeline.png({ compressionLevel: 9 });
      outputMime = 'image/png';
      outputExt = 'png';
    }

    sanitizedBuffer = await pipeline.toBuffer();
  } catch (err) {
    // Sharp failed to process - file is corrupted or not a real image
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Invalid image file: ${message}`);
  }

  return {
    buffer: sanitizedBuffer,
    mime: outputMime,
    ext: outputExt,
  };
}

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
 * Delete any existing files with the same base name but different extensions
 * This prevents stale files from accumulating when uploading different formats
 */
async function cleanupOldExtensions(
  uploadsPath: string,
  baseName: string,
  newExt: string,
): Promise<void> {
  try {
    const files = await fs.readdir(uploadsPath);
    const toDelete = files.filter((f) => {
      // Match files like "baseName.ext" or "baseName-original.ext"
      const isMainFile = f.startsWith(`${baseName}.`) && !f.includes('-original');
      const isOriginalFile = f.startsWith(`${baseName}-original.`);
      if (!isMainFile && !isOriginalFile) return false;

      // Only delete if it's a different extension
      const fileExt = f.split('.').pop();
      return fileExt !== newExt;
    });

    await Promise.all(
      toDelete.map((filename) =>
        fs.unlink(path.join(uploadsPath, filename)).catch(() => undefined),
      ),
    );
  } catch {
    // Directory doesn't exist yet - nothing to clean up
  }
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

  // Clean up any existing files with different extensions to prevent stale files
  await cleanupOldExtensions(uploadsPath, config.baseName, ext);

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

  // Build public URLs with cache-busting timestamp
  const relativePath = `/uploads/${config.category}/${config.identifier}/${config.subfolder}`;
  const cacheBuster = `?v=${Date.now()}`;

  return {
    url: buildPublicUrl(`${relativePath}/${filename}`) + cacheBuster,
    originalUrl: buildPublicUrl(`${relativePath}/${originalFilename}`) + cacheBuster,
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
 * Upload user avatar (legacy - trusts caller for validation)
 * @deprecated Use uploadUserAvatarSecure instead
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
 * Upload user avatar with full security validation
 *
 * This is the secure version that:
 * 1. Validates file size
 * 2. Validates magic bytes (not just MIME header)
 * 3. Re-encodes via sharp to strip metadata and ensure valid image
 * 4. Uses sanitized username for path safety
 *
 * @param rawBuffer - Raw uploaded file buffer (will be validated and sanitized)
 * @param declaredMime - MIME type declared by client (not trusted)
 * @param username - Username for storage path (will be sanitized)
 * @returns Upload result with URLs
 */
export async function uploadUserAvatarSecure(
  rawBuffer: Buffer,
  declaredMime: string | undefined,
  username: string,
): Promise<UploadResult> {
  // Validate and sanitize the image
  const validated = await validateAndSanitizeAvatarUpload(rawBuffer, declaredMime);

  // Use sanitized buffer for storage
  return processAndSaveImage(validated.buffer, validated.mime, getUserAvatarConfig(username));
}

/**
 * Upload company logo (legacy - trusts caller for validation)
 * @deprecated Use uploadCompanyLogoSecure instead
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
 * Upload company logo with full security validation
 *
 * This is the secure version that:
 * 1. Validates file size (2 MB limit)
 * 2. Validates magic bytes (not just MIME header)
 * 3. Re-encodes via sharp to strip metadata and ensure valid image
 * 4. Uses sanitized slug/name for path safety
 *
 * @param rawBuffer - Raw uploaded file buffer (will be validated and sanitized)
 * @param declaredMime - MIME type declared by client (not trusted)
 * @param slugOrName - Company slug or name for storage path (will be sanitized)
 * @returns Upload result with URLs
 */
export async function uploadCompanyLogoSecure(
  rawBuffer: Buffer,
  declaredMime: string | undefined,
  slugOrName: string,
): Promise<UploadResult> {
  // Validate and sanitize the image (same pipeline as avatar)
  const validated = await validateAndSanitizeAvatarUpload(rawBuffer, declaredMime);

  // Use sanitized buffer for storage
  return processAndSaveImage(validated.buffer, validated.mime, getCompanyLogoConfig(slugOrName));
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
