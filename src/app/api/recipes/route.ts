import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { toS3Key, getImageUrl } from '@/lib/image';
import { z } from 'zod';

const CreateRecipeSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
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
  friendUserIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/recipes
 * レシピ一覧の取得と検索（グループなしでも自分のレシピを表示可能）
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
    const isMine = searchParams.get('isMine') === 'true';

    if (groupId && !isMine) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const whereConditions: any = {
      deletedAt: null,
    };

    if (isMine) {
      whereConditions.createdBy = auth.userId;
    } else if (includeFriendShared) {
      whereConditions.friendShares = {
        some: { sharedWith: auth.userId },
      };
    } else if (groupId) {
      whereConditions.OR = [
        { groupId },
        { friendShares: { some: { sharedWith: auth.userId } } },
      ];
    } else {
      // グループ未指定・未所属時は自分のレシピ + 友達共有レシピ
      whereConditions.OR = [
        { createdBy: auth.userId },
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
 * レシピの新規作成（グループなしでも個人レシピとして作成可能）
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

    if (groupId) {
      const isMember = await checkGroupMembership(auth.userId, groupId);
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        groupId: groupId || null,
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
