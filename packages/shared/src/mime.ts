/**
 * Extension to MIME type mapping
 */
export const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = Object.keys(EXT_TO_MIME) as Array<keyof typeof EXT_TO_MIME>;

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = Object.values(EXT_TO_MIME);

/**
 * Get MIME type for a file extension
 */
export function getMimeByExt(ext: string): string | null {
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');
  return EXT_TO_MIME[normalizedExt] || null;
}

/**
 * Check if an extension is allowed
 */
export function isAllowedExt(ext: string): boolean {
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');
  return normalizedExt in EXT_TO_MIME;
}

/**
 * Check if a MIME type is allowed
 */
export function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mime);
}

/**
 * Get safe MIME type for a file extension (with fallback)
 */
export function safeMimeByExt(ext: string): string {
  return getMimeByExt(ext) || 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
export function getExtByMime(mime: string): string | null {
  for (const [ext, mimeType] of Object.entries(EXT_TO_MIME)) {
    if (mimeType === mime) {
      return ext;
    }
  }
  return null;
}
