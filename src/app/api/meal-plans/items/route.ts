import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { z } from 'zod';

const AddMealPlanItemSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  date: z.string().min(1),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  recipeId: z.string().uuid().optional().nullable(),
  note: z.string().max(100).optional().nullable(),
});

/**
 * POST /api/meal-plans/items
 * 献立アイテムの追加（グループまたは個人）
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = AddMealPlanItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { groupId, date, mealType, recipeId, note } = parsed.data;

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const planDate = new Date(date);

    // 該当日のMealPlanを取得または作成（グループまたは個人）
    let mealPlan = await prisma.mealPlan.findFirst({
      where: groupId
        ? { groupId, date: planDate }
        : { userId: auth.userId, groupId: null, date: planDate },
    });

    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          groupId: groupId || null,
          userId: auth.userId,
          date: planDate,
        },
      });
    }

    const count = await prisma.mealPlanItem.count({
      where: { mealPlanId: mealPlan.id, mealType },
    });

    const item = await prisma.mealPlanItem.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId: recipeId || null,
        mealType,
        note: note || null,
        sortOrder: count,
        addedBy: auth.userId,
      },
      include: {
        recipe: {
          select: { id: true, title: true, mainImageKey: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  });
}

/**
 * DELETE /api/meal-plans/items?itemId=xxx
 * 献立アイテムの削除
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const itemId = request.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    const item = await prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: { mealPlan: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    if (item.mealPlan.groupId) {
      const isMember = await checkGroupMembership(auth.userId, item.mealPlan.groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    } else {
      if (item.mealPlan.userId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.mealPlanItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}
