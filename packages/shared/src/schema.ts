import { z } from 'zod';

/**
 * Schema for URI JSON metadata - more flexible validation
 */
export const UriJsonSchema = z.object({
  image: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
  // Allow any additional properties
}).passthrough();

export type UriJson = z.infer<typeof UriJsonSchema>;

/**
 * Default URI JSON template
 */
export const DEFAULT_URI_JSON: UriJson = {
  image: 'https://cdn.zerafile.io/token/CONTRACT_ID/image.png',
  url: 'https://example.com',
  description: 'Token description',
  name: 'Token Name',
  symbol: 'SYMBOL',
  decimals: 18,
};

/**
 * Validate URI JSON data
 */
export function validateUriJson(data: unknown): UriJson {
  return UriJsonSchema.parse(data);
}

/**
 * Validate URI JSON data with lenient parsing (no errors thrown)
 */
export function validateUriJsonLenient(data: unknown): Partial<UriJson> {
  const result = UriJsonSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  // Return partial data for failed validation
  if (typeof data === 'object' && data !== null) {
    return data as Partial<UriJson>;
  }
  return {};
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
