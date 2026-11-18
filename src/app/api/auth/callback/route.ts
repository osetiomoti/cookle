import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Cognitoからのリダイレクト後にcodeをtokenに交換してcookieにセット
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (!domain || !clientId) {
    return NextResponse.redirect(`${origin}/login?error=config_missing`);
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
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('[Auth Callback] Token exchange failed:', errorData);
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokens = await res.json();
    const response = NextResponse.redirect(`${origin}/home`);

    const cookieOptions = (maxAge: number) => ({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      expires: new Date(Date.now() + maxAge * 1000),
      path: '/',
    });

    if (tokens.access_token) {
      response.cookies.set('access_token', tokens.access_token, cookieOptions(tokens.expires_in ?? 3600));
    }
    if (tokens.id_token) {
      response.cookies.set('id_token', tokens.id_token, cookieOptions(tokens.expires_in ?? 3600));
    }
    if (tokens.refresh_token) {
      response.cookies.set('refresh_token', tokens.refresh_token, cookieOptions(30 * 24 * 60 * 60));
      // iOS PWA対応: JSがlocalStorageに転記するための短命非httpOnlyクッキー
      response.cookies.set('rt_transfer', tokens.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 120,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(`${origin}/login?error=internal_error`);
  }
}

