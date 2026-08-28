import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(10, { message: 'JWT_SECRET must be at least 10 characters long' }),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment Variable Validation Failed:');
    const formattedErrors = result.error.format();

    Object.entries(formattedErrors).forEach(([key, value]) => {
      if (key !== '_errors' && value && '_errors' in value && Array.isArray(value._errors) && value._errors.length > 0) {
        console.error(`   - ${key}: ${value._errors.join(', ')}`);
      }
    });

    console.error('\nPlease verify your backend/.env configuration.\n');
    throw new Error('Invalid environment variables. Backend startup aborted.');
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
