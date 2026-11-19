import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { z } from 'zod';

const DEFAULT_CATEGORIES = [
  '主菜',
  '副菜',
  '汁物',
  'ご飯・麺',
  'お菓子',
  'パン',
  'その他',
];

/**
 * GET /api/categories
 * カテゴリ一覧（グループまたは個人）
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

    let categories = await prisma.category.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' },
    });

    // デフォルトカテゴリの自動投入
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((name, idx) => ({
          groupId: groupId || null,
          userId: groupId ? null : auth.userId,
          name,
          sortOrder: idx,
        })),
        skipDuplicates: true,
      });

      categories = await prisma.category.findMany({
        where: whereCondition,
        orderBy: { sortOrder: 'asc' },
      });
    }

    return NextResponse.json({ success: true, data: categories });
  });
}

const CreateCategorySchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(50),
});

/**
 * POST /api/categories
 * カテゴリ作成
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = CreateCategorySchema.safeParse(body);
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

    const count = await prisma.category.count({ where: whereCondition });
    const category = await prisma.category.create({
      data: {
        groupId: groupId || null,
        userId: groupId ? null : auth.userId,
        name,
        sortOrder: count,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  });
}
