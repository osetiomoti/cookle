import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, checkGroupMembership } from '@/lib/auth';
import { toS3Key, getImageUrl } from '@/lib/image';
import { deleteS3Objects } from '@/lib/s3';
import { z } from 'zod';

const UpdateCookingRecordSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  cookedAt: z.string().optional(),
  memo: z.string().optional().nullable(),
  photoKeys: z.array(z.string()).optional(),
  recipeId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/cooking-records/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const record = await prisma.cookingRecord.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarKey: true } },
        recipe: { select: { id: true, title: true, mainImageKey: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!record || record.deletedAt) {
      return NextResponse.json({ success: false, error: '料理記録が見つかりません' }, { status: 404 });
    }

    const isMember = await checkGroupMembership(auth.userId, record.groupId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formatted = {
      ...record,
      photos: record.photos.map((p) => ({
        ...p,
        imageUrl: getImageUrl(p.imageKey),
      })),
      recipe: record.recipe
        ? {
            ...record.recipe,
            mainImageUrl: getImageUrl(record.recipe.mainImageKey),
          }
        : null,
      isOwner: record.userId === auth.userId,
    };

    return NextResponse.json({ success: true, data: formatted });
  });
}

/**
 * PUT /api/cooking-records/[id]
 * 料理記録の編集（作成者本人のみ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const existing = await prisma.cookingRecord.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: '料理記録が見つかりません' }, { status: 404 });
    }

    if (existing.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: '他人の記録は編集できません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateCookingRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { title, cookedAt, memo, photoKeys, recipeId } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      if (photoKeys !== undefined) {
        await tx.cookingRecordPhoto.deleteMany({ where: { cookingRecordId: id } });
        if (photoKeys.length > 0) {
          await tx.cookingRecordPhoto.createMany({
            data: photoKeys.map((key, idx) => ({
              cookingRecordId: id,
              imageKey: toS3Key(key) || key,
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.cookingRecord.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(cookedAt !== undefined ? { cookedAt: new Date(cookedAt) } : {}),
          ...(memo !== undefined ? { memo } : {}),
          ...(recipeId !== undefined ? { recipeId } : {}),
        },
        include: {
          photos: { orderBy: { sortOrder: 'asc' } },
          recipe: { select: { id: true, title: true } },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  });
}

/**
 * DELETE /api/cooking-records/[id]
 * 料理記録の削除（作成者本人のみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (auth) => {
    const existing = await prisma.cookingRecord.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: '料理記録が見つかりません' }, { status: 404 });
    }

    if (existing.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: '他人の記録は削除できません' }, { status: 403 });
    }

    await prisma.cookingRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // S3画像削除
    const imageKeys = existing.photos.map((p) => p.imageKey).filter(Boolean);
    if (imageKeys.length > 0 && auth.idToken) {
      deleteS3Objects(imageKeys, auth.idToken).catch((err) =>
        console.error('[CookingRecord Delete] S3 error:', err)
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}

