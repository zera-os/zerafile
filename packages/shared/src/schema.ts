import { z } from 'zod';

/**
 * Schema for URI JSON metadata
 */
export const UriJsonSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500).optional(),
  image: z.string().url().optional(),
  external_url: z.string().url().optional(),
  attributes: z.array(z.object({
    trait_type: z.string().min(1).max(50),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })).optional(),
});

export type UriJson = z.infer<typeof UriJsonSchema>;

/**
 * Default URI JSON template
 */
export const DEFAULT_URI_JSON: UriJson = {
  name: '',
  description: '',
  image: '',
  external_url: '',
  attributes: [],
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
