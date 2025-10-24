import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

const envSchema = z.object({
  SPACES_ENDPOINT: z.string().url(),
  SPACES_REGION: z.string().default('us-east-1'),
  SPACES_BUCKET: z.string().min(1),
  SPACES_KEY: z.string().min(1),
  SPACES_SECRET: z.string().min(1),
  CDN_BASE_URL: z.string().url(),
  PORT: z.string().transform(Number).default('8080'),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
