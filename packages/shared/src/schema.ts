import { z } from 'zod';

/**
 * Schema for URI JSON metadata
 */
export const UriJsonSchema = z.object({
  image: z.string().url(),
  url: z.string().url(),
  description: z.string().min(1).max(500),
});

export type UriJson = z.infer<typeof UriJsonSchema>;

/**
 * Default URI JSON template
 */
export const DEFAULT_URI_JSON: UriJson = {
  image: 'https://cdn.zerafile.io/token/CONTRACT_ID/image.png',
  url: 'https://example.com',
  description: 'Token description',
};

/**
 * Validate URI JSON data
 */
export function validateUriJson(data: unknown): UriJson {
  return UriJsonSchema.parse(data);
}

/**
 * Check if data is valid URI JSON
 */
export function isValidUriJson(data: unknown): data is UriJson {
  try {
    UriJsonSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
