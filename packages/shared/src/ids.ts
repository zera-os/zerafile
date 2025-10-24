/**
 * Generate a random base62 ID of specified length
 */
export function generateId(length: number = 12): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate a random ID for file uploads
 */
export function generateFileId(): string {
  return generateId(12);
}
