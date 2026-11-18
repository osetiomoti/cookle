import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

/**
 * GET /api/friends/pending
 * 受信した申請中のともだちリクエスト
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const pending = await prisma.friendship.findMany({
      where: {
        friendId: auth.userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, avatarKey: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: pending });
  });
}

