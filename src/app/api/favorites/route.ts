import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/image';

/**
 * GET /api/favorites
 * ログインユーザーのお気に入りレシピ一覧
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (auth) => {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: auth.userId,
        recipe: { deletedAt: null },
      },
      include: {
        recipe: {
          include: {
            category: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true, avatarKey: true } },
          },
        },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = favorites.map((f) => ({
      ...f.recipe,
      mainImageUrl: getImageUrl(f.recipe.mainImageKey),
      favoriteId: f.id,
      folder: f.folder,
      isFavorite: true,
      favoritedAt: f.createdAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  });
}

