import { NextRequest, NextResponse } from 'next/server';
import { verifyCognitoToken, refreshCognitoTokens } from './cognito';
import { prisma } from './prisma';
import { isUuid } from './utils';
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

  // id_token から email や nickname を安全に取得
  let tokenEmail = cognitoPayload.email || '';
  let tokenName = '';

  if (idToken) {
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const idPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (idPayload.email) tokenEmail = idPayload.email;
        if (idPayload.nickname && !isUuid(idPayload.nickname)) tokenName = idPayload.nickname;
        else if (idPayload['cognito:username'] && !isUuid(idPayload['cognito:username'])) tokenName = idPayload['cognito:username'];
        else if (idPayload.name && !isUuid(idPayload.name)) tokenName = idPayload.name;
      }
    } catch {}
  }

  const initialName = tokenName || (tokenEmail ? tokenEmail.split('@')[0] : 'ユーザー');

  // 3. ユーザーをDBにupsert（初回登録時に自動作成）
  let user = await prisma.user.upsert({
    where: { cognitoSub: cognitoPayload.sub },
    update: {},
    create: {
      cognitoSub: cognitoPayload.sub,
      name: initialName,
      email: tokenEmail,
    },
    include: {
      groupMembers: { select: { groupId: true }, take: 1 },
    },
  });

  // 既存ユーザーでメールが未設定、または名前がUUIDの場合、自動で補正更新
  const needsEmailUpdate = (!user.email || user.email === '') && !!tokenEmail;
  const isNameUuid = isUuid(user.name) || user.name === user.cognitoSub;
  if (needsEmailUpdate || (isNameUuid && initialName !== 'ユーザー')) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(needsEmailUpdate ? { email: tokenEmail } : {}),
        ...(isNameUuid && initialName !== 'ユーザー' ? { name: initialName } : {}),
      },
      include: {
        groupMembers: { select: { groupId: true }, take: 1 },
      },
    });
  }

  const authContext: AuthContext = {
    userId: user.id,
    cognitoSub: user.cognitoSub,
    email: user.email || tokenEmail,
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
export async function checkGroupMembership(userId: string, groupId?: string | null): Promise<boolean> {
  if (!groupId) return false;
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!member;
}

