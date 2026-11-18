import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';

/**
 * GET /api/friends
 * ともだち一覧（accepted）
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: auth.userId },
          { friendId: auth.userId },
        ],
        status: 'ACCEPTED',
      },
      include: {
        user:   { select: { id: true, name: true, avatarKey: true, email: true } },
        friend: { select: { id: true, name: true, avatarKey: true, email: true } },
      },
    });

    const friends = friendships.map((f) => {
      const other = f.userId === auth.userId ? f.friend : f.user;
      return { ...other, friendshipId: f.id };
    });

    return NextResponse.json({ success: true, data: friends });
  });
}

const AddFriendSchema = z.object({
  friendUserId: z.string().uuid(),
});

/**
 * POST /api/friends
 * ともだち申請
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = AddFriendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '無効なユーザーIDです' }, { status: 400 });
    }

    const { friendUserId } = parsed.data;

    if (friendUserId === auth.userId) {
      return NextResponse.json({ success: false, error: '自分自身はともだち追加できません' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: friendUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: auth.userId, friendId: friendUserId },
          { userId: friendUserId, friendId: auth.userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'すでにともだち申請済みまたはともだちです' }, { status: 409 });
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId: auth.userId,
        friendId: friendUserId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, data: friendship }, { status: 201 });
  });
}

