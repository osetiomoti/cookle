import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';

/**
 * GET /api/shopping-lists?groupId=xxx
 * グループの買い物リストと全アイテムを取得
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const groupId = request.nextUrl.searchParams.get('groupId') || auth.groupId;
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'groupId is required' }, { status: 400 });
    }

    const isMember = await checkGroupMembership(auth.userId, groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // グループのデフォルト買い物リストを取得または作成
    let shoppingList = await prisma.shoppingList.findFirst({
      where: { groupId },
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
          groupId,
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

