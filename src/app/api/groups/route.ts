import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { toS3Key } from '@/lib/image';
import { generateInviteCode } from '@/lib/utils';
import { z } from 'zod';

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageKey: z.string().optional(),
});

/**
 * GET /api/groups
 * ログインユーザーが所属するグループ一覧
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: auth.userId },
      include: {
        group: {
          include: {
            members: { select: { userId: true, role: true } },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      myRole: m.role,
      memberCount: m.group.members.length,
    }));

    return NextResponse.json({ success: true, data: groups });
  });
}

/**
 * POST /api/groups
 * グループ作成（作成者をadminとして追加）
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = CreateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const { name, description, imageKey } = parsed.data;
    const inviteCode = generateInviteCode();

    const group = await prisma.group.create({
      data: {
        name,
        description,
        imageKey: imageKey ? toS3Key(imageKey) : null,
        inviteCode,
        createdBy: auth.userId,
        members: {
          create: {
            userId: auth.userId,
            role: 'ADMIN',
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  });
}

