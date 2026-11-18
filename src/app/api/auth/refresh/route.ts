import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/refresh
 * リフレッシュトークンでアクセストークンを更新
 * - httpOnly cookieから取得（通常ケース）
 * - request bodyから取得（iOS PWA cookie喪失時のフォールバック）
 */
export async function POST(request: NextRequest) {
  let refreshToken = request.cookies.get('refresh_token')?.value;
  let fromBody = false;

  if (!refreshToken) {
    try {
      const body = await request.json().catch(() => null);
      if (body?.refresh_token) {
        refreshToken = body.refresh_token;
        fromBody = true;
      }
    } catch {}
  }

  if (!refreshToken) {
    return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
  }

  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (!domain || !clientId) {
    return NextResponse.json({ success: false, error: 'Cognito configuration missing' }, { status: 500 });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const res = await fetch(`https://${domain}/oauth2/token`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Refresh failed' }, { status: 401 });
    }

    const tokens = await res.json();

    const cookieOptions = (maxAge: number) => ({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      expires: new Date(Date.now() + maxAge * 1000),
      path: '/',
    });

    const responseBody: Record<string, unknown> = { success: true };
    if (fromBody) {
      responseBody.refresh_token = tokens.refresh_token || refreshToken;
    }

    const response = NextResponse.json(responseBody);

    if (tokens.access_token) {
      response.cookies.set('access_token', tokens.access_token, cookieOptions(tokens.expires_in ?? 3600));
    }
    if (tokens.id_token) {
      response.cookies.set('id_token', tokens.id_token, cookieOptions(tokens.expires_in ?? 3600));
    }
    response.cookies.set('refresh_token', refreshToken, cookieOptions(30 * 24 * 60 * 60));

    return response;
  } catch (error) {
    console.error('[Auth Refresh] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

