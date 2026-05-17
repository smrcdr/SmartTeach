import { z } from 'zod'

const portSchema = z.string().regex(/^\d+$/).transform(Number)
const booleanSchema = z.enum(['true', 'false']).transform((value) => value === 'true')
const durationSchema = z.string().regex(/^\d+[smhd]$/)

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: portSchema.default(3000),
  API_PUBLIC_URL: z.string().url().optional(),
  WEB_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  MINIO_ENDPOINT: z.string().url(),
  MINIO_PUBLIC_ENDPOINT: z.string().url().optional(),
  MINIO_PORT: portSchema.default(9000),
  MINIO_CONSOLE_PORT: portSchema.default(9001),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(8),
  MINIO_BUCKET: z.string().min(3),
  MINIO_REGION: z.string().min(1).default('us-east-1'),
  MINIO_FORCE_PATH_STYLE: booleanSchema.default(true),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: durationSchema.default('15m'),
  JWT_REFRESH_TTL: durationSchema.default('30d'),
  JWT_ISSUER: z.string().min(1).default('smarteach-api'),
  JWT_AUDIENCE: z.string().min(1).default('smarteach-clients'),
  PASSWORD_HASH_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default(12),
  SWAGGER_ENABLED: booleanSchema.default(true),
})

export type AppEnvironment = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config)
}
