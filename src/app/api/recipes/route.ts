import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { toS3Key, getImageUrl } from '@/lib/image';
import { z } from 'zod';

const CreateRecipeSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1, 'レシピ名を入力してください').max(100),
  description: z.string().optional(),
  mainImageKey: z.string().optional(),
  cookTimeMin: z.number().int().positive().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  difficulty: z.enum(['EASY', 'NORMAL', 'HARD']).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.string().optional().nullable(),
      unit: z.string().optional().nullable(),
      sortOrder: z.number().int().default(0),
    })
  ).default([]),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      description: z.string().min(1),
      imageKey: z.string().optional().nullable(),
    })
  ).default([]),
  friendUserIds: z.array(z.string().uuid()).optional(), // ともだち共有
});

/**
 * GET /api/recipes?groupId=xxx&keyword=xxx&categoryId=xxx&tagId=xxx&favoriteOnly=true&maxCookTime=xxx
 * レシピ一覧の取得と検索
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId') || auth.groupId;
    const keyword = searchParams.get('keyword');
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const favoriteOnly = searchParams.get('favoriteOnly') === 'true';
    const maxCookTime = searchParams.get('maxCookTime') ? parseInt(searchParams.get('maxCookTime')!) : undefined;
    const includeFriendShared = searchParams.get('includeFriendShared') === 'true';

    if (!groupId && !includeFriendShared) {
      return NextResponse.json({ success: false, error: 'groupId is required' }, { status: 400 });
    }

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // 検索フィルタ構築
    const whereConditions: any = {
      deletedAt: null,
    };

    if (includeFriendShared && !groupId) {
      // ともだちから共有されたレシピのみ
      whereConditions.friendShares = {
        some: { sharedWith: auth.userId },
      };
    } else if (groupId) {
      // グループ内レシピ、またはともだち共有
      whereConditions.OR = [
        { groupId },
        { friendShares: { some: { sharedWith: auth.userId } } },
      ];
    }

    if (keyword) {
      whereConditions.AND = [
        ...(whereConditions.AND || []),
        {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { ingredients: { some: { name: { contains: keyword, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }

    if (tagId) {
      whereConditions.tags = {
        some: { tagId },
      };
    }

    if (maxCookTime) {
      whereConditions.cookTimeMin = { lte: maxCookTime };
    }

    if (favoriteOnly) {
      whereConditions.favorites = {
        some: { userId: auth.userId },
      };
    }

    const recipes = await prisma.recipe.findMany({
      where: whereConditions,
      include: {
        category: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        creator: { select: { id: true, name: true, avatarKey: true } },
        favorites: {
          where: { userId: auth.userId },
          select: { id: true },
        },
        _count: {
          select: {
            cookingRecords: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = recipes.map((r) => ({
      ...r,
      mainImageUrl: getImageUrl(r.mainImageKey),
      tags: r.tags.map((t) => t.tag),
      isFavorite: r.favorites.length > 0,
      isOwner: r.createdBy === auth.userId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  });
}

/**
 * POST /api/recipes
 * レシピの新規作成
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const body = await request.json();
    const parsed = CreateRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const {
      groupId,
      title,
      description,
      mainImageKey,
      cookTimeMin,
      servings,
      difficulty,
      categoryId,
      tagIds,
      ingredients,
      steps,
      friendUserIds,
    } = parsed.data;

    const isMember = await checkGroupMembership(auth.userId, groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        groupId,
        createdBy: auth.userId,
        title,
        description,
        mainImageKey: toS3Key(mainImageKey),
        cookTimeMin,
        servings,
        difficulty: difficulty || null,
        categoryId: categoryId || null,
        ingredients: {
          create: ingredients.map((ing, idx) => ({
            name: ing.name,
            amount: ing.amount || null,
            unit: ing.unit || null,
            sortOrder: ing.sortOrder !== undefined ? ing.sortOrder : idx,
          })),
        },
        steps: {
          create: steps.map((step, idx) => ({
            stepNumber: step.stepNumber || idx + 1,
            description: step.description,
            imageKey: toS3Key(step.imageKey),
          })),
        },
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        friendShares: friendUserIds && friendUserIds.length > 0
          ? {
              create: friendUserIds.map((sharedWith) => ({
                sharedBy: auth.userId,
                sharedWith,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        ingredients: { orderBy: { sortOrder: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, data: recipe }, { status: 201 });
  });
}

