import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { z } from 'zod';

const DEFAULT_TAGS = [
  '時短',
  '節約',
  '作り置き',
  '簡単',
  'お弁当',
  'ヘルシー',
];

/**
 * GET /api/tags
 * タグ一覧（グループまたは個人）
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const groupId = request.nextUrl.searchParams.get('groupId') || auth.groupId;

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const whereCondition = groupId
      ? { groupId }
      : { userId: auth.userId, groupId: null };

    let tags = await prisma.tag.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' },
    });

    if (tags.length === 0) {
      await prisma.tag.createMany({
        data: DEFAULT_TAGS.map((name, idx) => ({
          groupId: groupId || null,
          userId: groupId ? null : auth.userId,
          name,
          sortOrder: idx,
        })),
        skipDuplicates: true,
      });

      tags = await prisma.tag.findMany({
        where: whereCondition,
        orderBy: { sortOrder: 'asc' },
      });
    }

    return NextResponse.json({ success: true, data: tags });
  });
}

const CreateTagSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(50),
});

/**
 * POST /api/tags
 * 新規タグ作成
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const { groupId, name } = parsed.data;

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const whereCondition = groupId
      ? { groupId }
      : { userId: auth.userId, groupId: null };

    const count = await prisma.tag.count({ where: whereCondition });
    const tag = await prisma.tag.create({
      data: {
        groupId: groupId || null,
        userId: groupId ? null : auth.userId,
        name,
        sortOrder: count,
      },
    });

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  });
}
