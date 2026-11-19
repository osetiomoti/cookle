import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { getImageUrl } from '@/lib/image';

/**
 * GET /api/meal-plans
 * 月間献立一覧を取得（グループまたは個人）
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId') || auth.groupId;
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const whereConditions: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (groupId) {
      whereConditions.groupId = groupId;
    } else {
      whereConditions.userId = auth.userId;
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: whereConditions,
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                mainImageKey: true,
                cookTimeMin: true,
                category: { select: { id: true, name: true } },
              },
            },
            user: { select: { id: true, name: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    const formatted = mealPlans.map((mp) => ({
      ...mp,
      dateString: mp.date.toISOString().split('T')[0],
      items: mp.items.map((item) => ({
        ...item,
        recipe: item.recipe
          ? {
              ...item.recipe,
              mainImageUrl: getImageUrl(item.recipe.mainImageKey),
            }
          : null,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  });
}
