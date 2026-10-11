import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SENTRY_DSN: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  NEW_RELIC_APP_NAME: z.string().default('workwise-api'),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error('❌ Invalid environment configuration:');
    err.errors.forEach((e) => {
      console.error(`  ${e.path.join('.')}: ${e.message}`);
    });
    // Only exit in non-test environments for missing critical vars
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
  // Provide safe defaults for testing
  env = envSchema.parse({
    NODE_ENV: 'test',
    PORT: 4001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/workwise_test',
    JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-chars-long',
  });
}

export { env };
export type { Env };
