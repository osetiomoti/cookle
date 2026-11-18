import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { toS3Key, getImageUrl } from '@/lib/image';
import { deleteS3Objects } from '@/lib/s3';
import { z } from 'zod';

const UpdateRecipeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  mainImageKey: z.string().optional().nullable(),
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
  ).optional(),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      description: z.string().min(1),
      imageKey: z.string().optional().nullable(),
    })
  ).optional(),
  friendUserIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/recipes/[id]
 * レシピ詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        ingredients: { orderBy: { sortOrder: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        creator: { select: { id: true, name: true, avatarKey: true } },
        friendShares: { select: { sharedWith: true } },
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
    });

    if (!recipe || recipe.deletedAt) {
      return NextResponse.json({ success: false, error: 'レシピが見つかりません' }, { status: 404 });
    }

    // 閲覧権限確認: グループメンバー、共有先、作成者
    const isMember = await checkGroupMembership(auth.userId, recipe.groupId);
    const isShared = recipe.friendShares.some((s) => s.sharedWith === auth.userId);
    const isOwner = recipe.createdBy === auth.userId;

    if (!isMember && !isShared && !isOwner) {
      return NextResponse.json({ success: false, error: '閲覧権限がありません' }, { status: 403 });
    }

    const formatted = {
      ...recipe,
      mainImageUrl: getImageUrl(recipe.mainImageKey),
      steps: recipe.steps.map((s) => ({
        ...s,
        imageUrl: getImageUrl(s.imageKey),
      })),
      tags: recipe.tags.map((t) => t.tag),
      isFavorite: recipe.favorites.length > 0,
      isOwner,
    };

    return NextResponse.json({ success: true, data: formatted });
  });
}

/**
 * PUT /api/recipes/[id]
 * レシピ編集（作成者本人のみ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'レシピが見つかりません' }, { status: 404 });
    }

    // 編集権限確認: 登録者本人のみ
    if (existing.createdBy !== auth.userId) {
      return NextResponse.json({ success: false, error: '他人のレシピは編集できません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const {
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

    // トランザクションで関連データを一括更新
    const updated = await prisma.$transaction(async (tx) => {
      // 材料の入れ替え
      if (ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing, idx) => ({
            recipeId: id,
            name: ing.name,
            amount: ing.amount || null,
            unit: ing.unit || null,
            sortOrder: ing.sortOrder !== undefined ? ing.sortOrder : idx,
          })),
        });
      }

      // 手順の入れ替え
      if (steps !== undefined) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
        await tx.recipeStep.createMany({
          data: steps.map((step, idx) => ({
            recipeId: id,
            stepNumber: step.stepNumber || idx + 1,
            description: step.description,
            imageKey: toS3Key(step.imageKey),
          })),
        });
      }

      // タグの入れ替え
      if (tagIds !== undefined) {
        await tx.recipeTag.deleteMany({ where: { recipeId: id } });
        if (tagIds.length > 0) {
          await tx.recipeTag.createMany({
            data: tagIds.map((tagId) => ({ recipeId: id, tagId })),
          });
        }
      }

      // ともだち共有の入れ替え
      if (friendUserIds !== undefined) {
        await tx.recipeFriendShare.deleteMany({ where: { recipeId: id } });
        if (friendUserIds.length > 0) {
          await tx.recipeFriendShare.createMany({
            data: friendUserIds.map((sharedWith) => ({
              recipeId: id,
              sharedBy: auth.userId,
              sharedWith,
            })),
          });
        }
      }

      // 基本情報更新
      return tx.recipe.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(mainImageKey !== undefined ? { mainImageKey: toS3Key(mainImageKey) } : {}),
          ...(cookTimeMin !== undefined ? { cookTimeMin } : {}),
          ...(servings !== undefined ? { servings } : {}),
          ...(difficulty !== undefined ? { difficulty } : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
          ingredients: { orderBy: { sortOrder: 'asc' } },
          steps: { orderBy: { stepNumber: 'asc' } },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  });
}

/**
 * DELETE /api/recipes/[id]
 * レシピ削除（作成者本人のみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'レシピが見つかりません' }, { status: 404 });
    }

    // 削除権限確認: 登録者本人のみ
    if (existing.createdBy !== auth.userId) {
      return NextResponse.json({ success: false, error: '他人のレシピは削除できません' }, { status: 403 });
    }

    // 論理削除
    await prisma.recipe.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // S3画像クリーンアップ（非同期で試行）
    const imageKeys = [existing.mainImageKey, ...existing.steps.map((s) => s.imageKey)].filter(
      (k): k is string => !!k
    );
    if (imageKeys.length > 0 && auth.idToken) {
      deleteS3Objects(imageKeys, auth.idToken).catch((err) =>
        console.error('[Recipe Delete] S3 cleanup error:', err)
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}

