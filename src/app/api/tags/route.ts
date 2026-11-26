import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { z } from 'zod';

const DEFAULT_TAGS = [
  '主菜',
  '副菜',
  '汁物',
  'ご飯・麺',
  'お弁当',
  'スイーツ',
  'おつまみ',
  '時短',
  '節約',
  '作り置き',
  '簡単',
  'ヘルシー',
];

/**
 * GET /api/tags
 * タグ一覧（グループまたは個人、全員のタグ取得対応）
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const groupId = request.nextUrl.searchParams.get('groupId') || auth.groupId;
    const includeAll = request.nextUrl.searchParams.get('includeAll') === 'true';

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    let whereCondition: any;
    if (includeAll) {
      whereCondition = {
        OR: [
          ...(groupId ? [{ groupId }] : []),
          { userId: auth.userId },
          { groupId: null, userId: null }, // システムデフォルト
        ],
      };
    } else {
      whereCondition = groupId
        ? { groupId }
        : { userId: auth.userId, groupId: null };
    }

    let tags = await prisma.tag.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: { recipeTags: true },
        },
      },
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
        include: {
          _count: {
            select: { recipeTags: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    }

    // 重複するタグ名を排除してユニークにする
    const uniqueMap = new Map();
    tags.forEach((t: any) => {
      const existing = uniqueMap.get(t.name);
      if (!existing) {
        uniqueMap.set(t.name, {
          ...t,
          recipeCount: t._count?.recipeTags || 0,
        });
      } else {
        // カウントを合算
        existing.recipeCount = (existing.recipeCount || 0) + (t._count?.recipeTags || 0);
      }
    });
    const uniqueTags = Array.from(uniqueMap.values());

    return NextResponse.json({ success: true, data: uniqueTags });
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

    // 既存タグがあるか確認
    const existing = await prisma.tag.findFirst({
      where: {
        ...whereCondition,
        name: name.trim().replace(/^#/, ''),
      },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing }, { status: 200 });
    }

    const count = await prisma.tag.count({ where: whereCondition });
    const tag = await prisma.tag.create({
      data: {
        groupId: groupId || null,
        userId: groupId ? null : auth.userId,
        name: name.trim().replace(/^#/, ''),
        sortOrder: count,
      },
    });

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  });
}
