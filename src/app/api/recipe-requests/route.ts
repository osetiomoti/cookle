import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { getImageUrl } from '@/lib/image';

/**
 * GET /api/recipe-requests
 * ユーザーに関係する作ってほしいレシピリクエスト一覧
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId') || auth.groupId;
    const status = searchParams.get('status'); // 'OPEN' | 'ACCEPTED' | 'COOKED'
    const isMine = searchParams.get('isMine') === 'true';

    // 抽出条件
    const orConditions: any[] = [
      { userId: auth.userId },
      { targetUserId: auth.userId },
    ];

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (isMember) {
        orConditions.push({ groupId });
      }
    }

    const where: any = {
      OR: isMine ? [{ userId: auth.userId }] : orConditions,
    };

    if (status) {
      where.status = status;
    }

    const requests = await prisma.recipeRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, avatarKey: true } },
        targetUser: { select: { id: true, name: true, avatarKey: true } },
        cookUser: { select: { id: true, name: true, avatarKey: true } },
        recipe: {
          select: {
            id: true,
            title: true,
            mainImageKey: true,
            cookTimeMin: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN -> ACCEPTED -> COOKED
        { createdAt: 'desc' },
      ],
    });

    const formatted = requests.map((req) => ({
      ...req,
      requester: {
        ...req.requester,
        avatarUrl: getImageUrl(req.requester.avatarKey),
      },
      targetUser: req.targetUser
        ? {
            ...req.targetUser,
            avatarUrl: getImageUrl(req.targetUser.avatarKey),
          }
        : null,
      cookUser: req.cookUser
        ? {
            ...req.cookUser,
            avatarUrl: getImageUrl(req.cookUser.avatarKey),
          }
        : null,
      recipe: req.recipe
        ? {
            ...req.recipe,
            mainImageUrl: getImageUrl(req.recipe.mainImageKey),
          }
        : null,
      isRequester: req.userId === auth.userId,
      isTarget: req.targetUserId === auth.userId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  });
}

/**
 * POST /api/recipe-requests
 * 作ってほしいレシピリクエストを作成
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    try {
      const body = await request.json();
      const { groupId, targetUserId, recipeId, note } = body;
      let customTitle = body.customTitle?.trim();

      // レシピIDが指定されていてタイトルが空の場合、レシピタイトルを使用
      if (!customTitle && recipeId) {
        const recipe = await prisma.recipe.findUnique({
          where: { id: recipeId },
          select: { title: true },
        });
        if (recipe) {
          customTitle = recipe.title;
        }
      }

      if (!customTitle) {
        return NextResponse.json(
          { success: false, error: '料理名またはレシピを入力してください' },
          { status: 400 }
        );
      }

      // グループ所属チェック（groupId指定時）
      if (groupId) {
        const isMember = await checkGroupMembership(auth.userId, groupId);
        if (!isMember) {
          return NextResponse.json(
            { success: false, error: 'グループへの権限がありません' },
            { status: 403 }
          );
        }
      }

      const newRequest = await prisma.recipeRequest.create({
        data: {
          groupId: groupId || undefined,
          userId: auth.userId,
          targetUserId: targetUserId || undefined,
          recipeId: recipeId || undefined,
          customTitle,
          note: note?.trim() || undefined,
          status: 'OPEN',
        },
        include: {
          requester: { select: { id: true, name: true, avatarKey: true } },
          targetUser: { select: { id: true, name: true, avatarKey: true } },
          recipe: {
            select: {
              id: true,
              title: true,
              mainImageKey: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            ...newRequest,
            requester: {
              ...newRequest.requester,
              avatarUrl: getImageUrl(newRequest.requester.avatarKey),
            },
            recipe: newRequest.recipe
              ? {
                  ...newRequest.recipe,
                  mainImageUrl: getImageUrl(newRequest.recipe.mainImageKey),
                }
              : null,
          },
        },
        { status: 201 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || '作成に失敗しました' },
        { status: 500 }
      );
    }
  });
}

