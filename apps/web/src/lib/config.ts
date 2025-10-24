// Environment configuration for client-side usage
export const config = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
  cdnBase: process.env.NEXT_PUBLIC_CDN_BASE || 'http://localhost:8080',
} as const;
