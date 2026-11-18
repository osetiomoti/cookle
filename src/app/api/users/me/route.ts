import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';
import { toS3Key } from '@/lib/image';

/**
 * GET /api/users/me
 * ログイン中ユーザーのプロフィールを取得
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarKey: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  });
}

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatarKey: z.string().optional(),
});

/**
 * PATCH /api/users/me
 * プロフィールの更新
 */
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const { name, avatarKey } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(name ? { name } : {}),
        ...(avatarKey !== undefined ? { avatarKey: toS3Key(avatarKey) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarKey: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  });
}

