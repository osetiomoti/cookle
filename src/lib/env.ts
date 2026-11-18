/**
 * 型安全な環境変数アクセス
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL:              requireEnv('DATABASE_URL'),
  COGNITO_REGION:            process.env.COGNITO_REGION ?? 'ap-northeast-1',
  COGNITO_USER_POOL_ID:      process.env.COGNITO_USER_POOL_ID ?? '',
  COGNITO_CLIENT_ID:         process.env.COGNITO_CLIENT_ID ?? '',
  COGNITO_CLIENT_SECRET:     process.env.COGNITO_CLIENT_SECRET ?? '',
  COGNITO_DOMAIN:            process.env.COGNITO_DOMAIN ?? '',
  COGNITO_IDENTITY_POOL_ID:  process.env.COGNITO_IDENTITY_POOL_ID ?? '',
  AWS_REGION:                process.env.AWS_REGION ?? 'ap-northeast-1',
  AWS_S3_BUCKET_NAME:        process.env.AWS_S3_BUCKET_NAME ?? '',
  NEXT_PUBLIC_CLOUDFRONT_DOMAIN: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ?? '',
  NEXT_PUBLIC_APP_URL:       process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100',
} as const;

