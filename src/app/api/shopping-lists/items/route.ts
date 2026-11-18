import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { z } from 'zod';

const AddShoppingItemSchema = z.object({
  shoppingListId: z.string().uuid(),
  name: z.string().min(1, '商品名を入力してください').max(100),
  amount: z.string().max(50).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  memo: z.string().max(200).optional().nullable(),
});

/**
 * POST /api/shopping-lists/items
 * 買い物アイテムの追加
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = AddShoppingItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { shoppingListId, name, amount, unit, memo } = parsed.data;

    const list = await prisma.shoppingList.findUnique({ where: { id: shoppingListId } });
    if (!list) {
      return NextResponse.json({ success: false, error: 'Shopping list not found' }, { status: 404 });
    }

    const isMember = await checkGroupMembership(auth.userId, list.groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const count = await prisma.shoppingListItem.count({ where: { shoppingListId } });
    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId,
        name,
        amount: amount || null,
        unit: unit || null,
        memo: memo || null,
        sortOrder: count,
        addedBy: auth.userId,
      },
      include: {
        addedByUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  });
}

const UpdateShoppingItemSchema = z.object({
  itemId: z.string().uuid(),
  isPurchased: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  amount: z.string().max(50).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  memo: z.string().max(200).optional().nullable(),
});

/**
 * PATCH /api/shopping-lists/items
 * 購入状態の切り替え、アイテム編集
 */
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = UpdateShoppingItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { itemId, isPurchased, name, amount, unit, memo } = parsed.data;

    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: { shoppingList: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const isMember = await checkGroupMembership(auth.userId, item.shoppingList.groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (isPurchased !== undefined) {
      updateData.isPurchased = isPurchased;
      updateData.purchasedBy = isPurchased ? auth.userId : null;
      updateData.purchasedAt = isPurchased ? new Date() : null;
    }
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (unit !== undefined) updateData.unit = unit;
    if (memo !== undefined) updateData.memo = memo;

    const updated = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        addedByUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  });
}

/**
 * DELETE /api/shopping-lists/items?itemId=xxx
 * 買い物アイテムの削除
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const itemId = request.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: { shoppingList: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const isMember = await checkGroupMembership(auth.userId, item.shoppingList.groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.shoppingListItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}

