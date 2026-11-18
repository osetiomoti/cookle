import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

/**
 * POST /api/favorites/[recipeId]
 * お気に入り登録（存在すればフォルダ更新、無ければ作成）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  return withAuth(request, async (auth) => {
    const body = await request.json().catch(() => ({}));
    const { folderId } = body;

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_recipeId: {
          userId: auth.userId,
          recipeId,
        },
      },
      update: {
        folderId: folderId || null,
      },
      create: {
        userId: auth.userId,
        recipeId,
        folderId: folderId || null,
      },
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  });
}

/**
 * DELETE /api/favorites/[recipeId]
 * お気に入り解除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  return withAuth(request, async (auth) => {
    await prisma.favorite.deleteMany({
      where: {
        userId: auth.userId,
        recipeId,
      },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  });
}

