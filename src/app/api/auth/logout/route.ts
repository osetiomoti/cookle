import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * トークンcookieをクリアしてログイン画面へリダイレクト
 */
export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`);

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

  return response;
}

