import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

/**
 * PATCH /api/recipe-requests/[id]
 * リクエストのステータス更新（「作るよ！」「作ったよ！」）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withAuth(request, async (auth) => {
    try {
      const existing = await prisma.recipeRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'リクエストが見つかりません' },
          { status: 404 }
        );
      }

      const body = await request.json();
      const { status } = body;

      if (!['OPEN', 'ACCEPTED', 'COOKED'].includes(status)) {
        return NextResponse.json(
          { success: false, error: '無効なステータスです' },
          { status: 400 }
        );
      }

      const updateData: any = {
        status,
      };

      if (status === 'COOKED') {
        updateData.cookedBy = auth.userId;
        updateData.cookedAt = new Date();
      } else if (status === 'ACCEPTED') {
        updateData.cookedBy = auth.userId;
      } else if (status === 'OPEN') {
        updateData.cookedBy = null;
        updateData.cookedAt = null;
      }

      const updated = await prisma.recipeRequest.update({
        where: { id },
        data: updateData,
        include: {
          requester: { select: { id: true, name: true, avatarKey: true } },
          targetUser: { select: { id: true, name: true, avatarKey: true } },
          cookUser: { select: { id: true, name: true, avatarKey: true } },
          recipe: { select: { id: true, title: true, mainImageKey: true } },
        },
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || '更新に失敗しました' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/recipe-requests/[id]
 * リクエストを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withAuth(request, async (auth) => {
    try {
      const existing = await prisma.recipeRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'リクエストが見つかりません' },
          { status: 404 }
        );
      }

      // 作成者本人のみ削除可能
      if (existing.userId !== auth.userId) {
        return NextResponse.json(
          { success: false, error: '削除権限がありません' },
          { status: 403 }
        );
      }

      await prisma.recipeRequest.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || '削除に失敗しました' },
        { status: 500 }
      );
    }
  });
}

