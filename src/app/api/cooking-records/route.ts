import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { toS3Key, getImageUrl } from '@/lib/image';
import { z } from 'zod';

const CreateCookingRecordSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  recipeId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, '料理名を入力してください').max(100),
  cookedAt: z.string().min(1, '日付を入力してください'),
  memo: z.string().optional().nullable(),
  photoKeys: z.array(z.string()).default([]),
});

/**
 * GET /api/cooking-records
 * 料理記録一覧（グループ所属時はグループ内、未所属時は自分の記録）
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId') || auth.groupId;
    const recipeId = searchParams.get('recipeId');

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const whereConditions: any = {
      deletedAt: null,
      ...(recipeId ? { recipeId } : {}),
    };

    if (groupId) {
      whereConditions.groupId = groupId;
    } else {
      whereConditions.userId = auth.userId;
    }

    const records = await prisma.cookingRecord.findMany({
      where: whereConditions,
      include: {
        user: { select: { id: true, name: true, avatarKey: true } },
        recipe: { select: { id: true, title: true, mainImageKey: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { cookedAt: 'desc' },
    });

    const formatted = records.map((r) => ({
      ...r,
      photos: r.photos.map((p) => ({
        ...p,
        imageUrl: getImageUrl(p.imageKey),
      })),
      recipe: r.recipe
        ? {
            ...r.recipe,
            mainImageUrl: getImageUrl(r.recipe.mainImageKey),
          }
        : null,
      isOwner: r.userId === auth.userId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  });
}

/**
 * POST /api/cooking-records
 * 料理記録の新規作成（グループなしでも個人記録として作成可能）
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = CreateCookingRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const { groupId, recipeId, title, cookedAt, memo, photoKeys } = parsed.data;

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const record = await prisma.cookingRecord.create({
      data: {
        groupId: groupId || null,
        userId: auth.userId,
        recipeId: recipeId || null,
        title,
        cookedAt: new Date(cookedAt),
        memo: memo || null,
        photos: {
          create: photoKeys.map((key, idx) => ({
            imageKey: toS3Key(key) || key,
            sortOrder: idx,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, avatarKey: true } },
        recipe: { select: { id: true, title: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  });
}
