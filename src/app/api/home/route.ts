import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { getImageUrl } from '@/lib/image';
import { ensureSampleRecipes } from '@/lib/sampleRecipes';

/**
 * GET /api/home
 * ホーム画面用の集約API
 * 1回のリクエストで 今日の献立・最新レシピ(4件)・料理記録(3件)・未完了リクエスト(2件)・買い物未購入件数 を並列取得
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId') || auth.groupId;

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // 新規ユーザーの場合は初期サンプルレシピ3品を用意
    await ensureSampleRecipes(auth.userId);

    // 並列実行でDBクエリのウォーターフォールを解消
    const [todayPlan, recipes, records, openRequests, unpurchasedCount, sampleRecipes] = await Promise.all([
      // 1. 今日の献立
      prisma.mealPlan.findFirst({
        where: {
          date: todayDate,
          ...(groupId ? { groupId } : { userId: auth.userId }),
        },
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  title: true,
                  mainImageKey: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),

      // 2. 最新レシピ4件（仕様: グループ指定時も個人レシピ(groupId: null)を含める）
      prisma.recipe.findMany({
        where: {
          deletedAt: null,
          OR: groupId
            ? [
                { groupId },
                { createdBy: auth.userId, groupId: null },
                { friendShares: { some: { sharedWith: auth.userId } } },
              ]
            : [
                { createdBy: auth.userId },
                { friendShares: { some: { sharedWith: auth.userId } } },
              ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          mainImageKey: true,
          cookTimeMin: true,
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, avatarKey: true, email: true } },
          favorites: {
            where: { userId: auth.userId },
            select: { id: true },
            take: 1,
          },
          _count: {
            select: { favorites: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),

      // 3. 最新の料理記録3件
      prisma.cookingRecord.findMany({
        where: {
          deletedAt: null,
          ...(groupId ? { groupId } : { userId: auth.userId }),
        },
        include: {
          user: { select: { id: true, name: true, avatarKey: true, email: true } },
          photos: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { imageKey: true },
          },
        },
        orderBy: { cookedAt: 'desc' },
        take: 3,
      }),

      // 4. 募集中リクエスト2件
      prisma.recipeRequest.findMany({
        where: {
          status: 'OPEN',
          OR: [
            ...(groupId ? [{ groupId }] : []),
            { userId: auth.userId },
            { targetUserId: auth.userId },
          ],
        },
        include: {
          requester: { select: { id: true, name: true, avatarKey: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),

      // 5. 買い物リスト未購入件数
      prisma.shoppingListItem.count({
        where: {
          isPurchased: false,
          shoppingList: groupId
            ? { groupId }
            : { userId: auth.userId },
        },
      }),

      // 6. 「まずこれを作ってみよう」サンプルレシピ3品
      prisma.recipe.findMany({
        where: {
          createdBy: auth.userId,
          deletedAt: null,
          title: { in: ['ふんわり卵のとろとろオムライス', '豚バラとキャベツのうま塩炒め', 'ほっこり定番肉じゃが'] },
        },
        select: {
          id: true,
          title: true,
          description: true,
          mainImageKey: true,
          cookTimeMin: true,
          servings: true,
          difficulty: true,
          category: { select: { id: true, name: true } },
          tags: { select: { tag: { select: { id: true, name: true } } } },
        },
        orderBy: { cookTimeMin: 'asc' },
        take: 3,
      }),
    ]);

    const formattedRecipes = recipes.map((r) => ({
      ...r,
      mainImageUrl: getImageUrl(r.mainImageKey),
      isFavorite: r.favorites.length > 0,
      creator: {
        ...r.creator,
        avatarUrl: getImageUrl(r.creator.avatarKey),
      },
    }));

    const formattedRecords = records.map((rec) => ({
      ...rec,
      photos: rec.photos.map((p) => ({
        imageUrl: getImageUrl(p.imageKey),
      })),
      user: {
        ...rec.user,
        avatarUrl: getImageUrl(rec.user.avatarKey),
      },
    }));

    const formattedRequests = openRequests.map((req) => ({
      ...req,
      requester: {
        ...req.requester,
        avatarUrl: getImageUrl(req.requester.avatarKey),
      },
    }));

    const formattedSampleRecipes = sampleRecipes.map((r) => ({
      ...r,
      mainImageUrl: getImageUrl(r.mainImageKey),
      tags: r.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      success: true,
      data: {
        todayPlan,
        recipes: formattedRecipes,
        records: formattedRecords,
        openRequests: formattedRequests,
        unpurchasedCount,
        sampleRecipes: formattedSampleRecipes,
      },
    });
  });
}

