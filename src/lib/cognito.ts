import { CognitoJwtVerifier } from 'aws-jwt-verify';

/**
 * AWS Cognito JWT Verifier
 * 公開鍵はJWKSエンドポイントから自動取得・キャッシュされる
 */
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export interface CognitoPayload {
  sub: string;
  email: string;
  username: string;
  exp: number;
}

export async function verifyCognitoToken(token: string): Promise<CognitoPayload> {
  const payload = await verifier.verify(token);
  return {
    sub: payload.sub,
    email: (payload['email'] as string) ?? '',
    username: (payload['cognito:username'] as string) ?? payload.sub,
    exp: payload.exp,
  };
}

/**
 * Cognito Hosted UIのリフレッシュトークンでアクセストークンを更新
 */
export async function refreshCognitoTokens(refreshToken: string): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (!domain || !clientId) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const res = await fetch(`https://${domain}/oauth2/token`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

