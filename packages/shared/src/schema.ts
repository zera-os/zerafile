import { z } from 'zod';

/**
 * Schema for URI JSON metadata - completely flexible validation
 * Accepts any JSON object structure
 */
export const UriJsonSchema = z.any();

export type UriJson = any;

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
 * Validate URI JSON data - accepts any JSON structure
 */
export function validateUriJson(data: unknown): UriJson {
  return data as UriJson;
}

/**
 * Validate URI JSON data with lenient parsing (no errors thrown)
 */
export function validateUriJsonLenient(data: unknown): UriJson {
  return data as UriJson;
}

/**
 * Check if data is valid URI JSON - accepts any JSON structure
 */
export function isValidUriJson(data: unknown): data is UriJson {
  return typeof data === 'object' && data !== null;
}
