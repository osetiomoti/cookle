import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';

/**
 * GET /api/shopping-lists
 * 買い物リストと全アイテムを取得（グループまたは個人）
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

    let shoppingList = await prisma.shoppingList.findFirst({
      where: whereCondition,
      include: {
        items: {
          include: {
            addedByUser: { select: { id: true, name: true } },
          },
          orderBy: [
            { isPurchased: 'asc' },
            { sortOrder: 'asc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!shoppingList) {
      shoppingList = await prisma.shoppingList.create({
        data: {
          groupId: groupId || null,
          userId: auth.userId,
          name: '買い物リスト',
        },
        include: {
          items: {
            include: {
              addedByUser: { select: { id: true, name: true } },
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: shoppingList });
  });
}
