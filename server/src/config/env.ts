import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load env from the current working dir and, in the monorepo, the repo root.
// dotenv does not override already-set variables, so layering is safe.
loadEnv();
loadEnv({ path: resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/blind-tasting'),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export type Env = typeof env;
