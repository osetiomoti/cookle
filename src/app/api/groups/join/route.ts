import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';

const JoinSchema = z.object({
  inviteCode: z.string().min(1),
});

/**
 * POST /api/groups/join
 * 招待コードでグループに参加
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'inviteCode is required' }, { status: 400 });
    }

    const { inviteCode } = parsed.data;

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: '招待コードが見つかりません' }, { status: 404 });
    }

    // 既にメンバーか確認
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: auth.userId } },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'すでにメンバーです' }, { status: 409 });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: auth.userId,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ success: true, data: { group, member } }, { status: 201 });
  });
}

