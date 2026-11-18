import { NextRequest, NextResponse } from 'next/server';
import { verifyCognitoToken, refreshCognitoTokens } from './cognito';
import { prisma } from './prisma';
import type { AuthContext } from '@/types/api';

/**
 * API認証ラッパー
 * Cognito JWTをcookieから検証し、ユーザー情報をDBと同期してhandlerを呼び出す
 */
export async function withAuth(
  request: NextRequest,
  handler: (auth: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // DEV ONLY: dev_tokenによるバイパス
  if (process.env.NODE_ENV !== 'production') {
    const devToken = request.cookies.get('dev_token')?.value;
    if (devToken) {
      try {
        const payload = JSON.parse(Buffer.from(devToken, 'base64').toString('utf-8'));
        if (payload.dev && payload.userId) {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
              groupMembers: { select: { groupId: true }, take: 1 },
            },
          });
          if (user) {
            return handler({
              userId: user.id,
              cognitoSub: user.cognitoSub,
              email: user.email,
              groupId: user.groupMembers[0]?.groupId ?? null,
              idToken: null,
            });
          }
        }
      } catch {}
    }
  }

  // 1. access_token をcookieから取得
  let token = request.cookies.get('access_token')?.value ?? null;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  let idToken = request.cookies.get('id_token')?.value ?? null;

  let cognitoPayload = null;
  let newTokens: Awaited<ReturnType<typeof refreshCognitoTokens>> = null;

  if (token) {
    try {
      cognitoPayload = await verifyCognitoToken(token);
    } catch {
      token = null;
    }
  }

  // 2. 期限切れならrefresh
  if (!cognitoPayload && refreshToken) {
    newTokens = await refreshCognitoTokens(refreshToken);
    if (newTokens) {
      try {
        cognitoPayload = await verifyCognitoToken(newTokens.access_token);
        idToken = newTokens.id_token;
      } catch {
        cognitoPayload = null;
      }
    }
  }

  if (!cognitoPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 3. ユーザーをDBにupsert（初回登録時に自動作成）
  let user = await prisma.user.upsert({
    where: { cognitoSub: cognitoPayload.sub },
    update: {},
    create: {
      cognitoSub: cognitoPayload.sub,
      name: cognitoPayload.username,
      email: cognitoPayload.email,
    },
    include: {
      groupMembers: { select: { groupId: true }, take: 1 },
    },
  });

  const authContext: AuthContext = {
    userId: user.id,
    cognitoSub: user.cognitoSub,
    email: user.email,
    groupId: user.groupMembers[0]?.groupId ?? null,
    idToken,
  };

  const response = await handler(authContext);

  // 4. トークンが更新された場合はcookieをセット
  if (newTokens) {
    const cookieOptions = (maxAge: number) => ({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    });
    response.cookies.set('access_token', newTokens.access_token, cookieOptions(newTokens.expires_in ?? 3600));
    response.cookies.set('id_token', newTokens.id_token, cookieOptions(newTokens.expires_in ?? 3600));
  }

  return response;
}

/**
 * グループメンバーシップを確認する
 */
export async function checkGroupMembership(userId: string, groupId: string): Promise<boolean> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!member;
}

