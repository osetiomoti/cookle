import { NextRequest, NextResponse } from 'next/server';

/**
 * ログアウト処理
 * トークンCookieをクリアしてアプリのルート (/) へリダイレクト
 */
function handleLogout(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const domain = process.env.COGNITO_DOMAIN || process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;

  // Cookieクリア用のレスポンスを作成（リダイレクト先はルート /）
  const response = NextResponse.redirect(`${origin}/`);

  const clearCookie = (name: string) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      expires: new Date(0),
      path: '/',
    });
  };

  clearCookie('access_token');
  clearCookie('id_token');
  clearCookie('refresh_token');
  clearCookie('rt_transfer');

  // Cognito Hosted UI 側のセッションもクリアする場合はCognitoのlogoutエンドポイントへ転送
  if (domain && clientId) {
    const logoutUri = encodeURIComponent(`${origin}/`);
    const cognitoLogoutUrl = `https://${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
    const cognitoResponse = NextResponse.redirect(cognitoLogoutUrl);
    ['access_token', 'id_token', 'refresh_token', 'rt_transfer'].forEach((name) => {
      cognitoResponse.cookies.set(name, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      });
    });
    return cognitoResponse;
  }

  return response;
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
