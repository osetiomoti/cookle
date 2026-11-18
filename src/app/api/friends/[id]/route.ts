import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

/**
 * DELETE /api/friends/[id]
 * ともだち関係を解除または拒否
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json({ success: false, error: '関係が見つかりません' }, { status: 404 });
    }

    if (friendship.userId !== auth.userId && friendship.friendId !== auth.userId) {
      return NextResponse.json({ success: false, error: '権限がありません' }, { status: 403 });
    }

    await prisma.friendship.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}

