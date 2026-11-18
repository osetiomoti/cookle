# AI_CONTEXT.md — くっくる（Cookcle）プロジェクト前提・文脈ガイド

> **重要**: AIエージェント（Antigravity等）が本リポジトリで作業を開始する際は、**必ず最初に本ドキュメントを一読してください**。

---

## 1. プロジェクト基本情報

- **アプリ名**: くっくる（Cookcle）
- **GitHubリポジトリ**: `https://github.com/osetiomoti/cookle`
- **リポジトリディレクトリ**: `c:\Users\Googl\source\repos\cookle`
- **コンセプト**: みんなでレシピを共有して、毎日の料理をもっと楽しくするWebアプリ
- **姉妹アプリ**:
  - **ふたりば**: `https://github.com/osetiomoti/futariba`（デザイン思想・カラーパレット `#FF6F91` の継承元）
  - **tabereco**: `https://github.com/osetiomoti/tabereco`（Cognito認証・グループ/ともだち設計・S3/CloudFront配信の継承元）

---

## 2. 技術スタック

| 区分 | 採用技術 | バージョン/詳細 |
|---|---|---|
| フロントエンド | Next.js (App Router) | 15.5.14 |
| UIライブラリ | React / React DOM | 19.0.0 |
| 言語 | TypeScript | 5.7.3 |
| スタイリング | Tailwind CSS | 3.4.17（カスタムカラー: `#FF6F91`） |
| データベース | Neon PostgreSQL | pooler + direct 両対応 |
| ORM | Prisma | 6.3.1 |
| 認証 | AWS Cognito | Hosted UI + OAuth2 Authorization Code Flow (`aws-jwt-verify`) |
| ストレージ | AWS S3 | `cookle-media-prod`（Cognito Identity Pool一時認証・直接アップロード） |
| CDN | Amazon CloudFront | `d2kojew12hdnr2.cloudfront.net` |
| データフェッチ | SWR | 2.4.1 |
| アイコン | Lucide React | 0.363.0 |

---

## 3. ディレクトリ構成概要

```
cookle/
├── prisma/
│   └── schema.prisma        # データベーススキーマ定義
├── src/
│   ├── app/
│   │   ├── (app)/           # 認証済みメインページ群
│   │   │   ├── layout.tsx   # SWR, Toast, Auth, BottomNav統合レイアウト
│   │   │   ├── home/        # ホーム（今日の献立、新着、クイックアクション）
│   │   │   ├── recipes/     # レシピ一覧・検索・新規投稿・詳細（人数自動計算付き）
│   │   │   ├── cooking-records/ # 料理記録・写真ギャラリー
│   │   │   ├── meal-plans/  # 献立カレンダー（月表示・朝昼夕夜）
│   │   │   ├── shopping-lists/  # 買い物リスト（リアルタイムグループ共有）
│   │   │   ├── groups/      # グループ管理・招待コード
│   │   │   ├── friends/     # ともだち管理・申請
│   │   │   ├── favorites/   # 個人お気に入りレシピ
│   │   │   └── mypage/      # マイページ・プロフィール編集・ログアウト
│   │   ├── api/             # API Routes (withAuth認証ガード)
│   │   ├── login/           # ログイン・セッション自動復元
│   │   ├── group-setup/     # 初回グループ作成・参加
│   │   └── globals.css      # スタイル・セーフエリア対応
│   ├── components/
│   │   ├── layout/          # Header, BottomNav
│   │   └── ui/              # Button, Card, Modal, Input, ImageUpload, Toast
│   ├── contexts/            # AppContext (ユーザー・選択グループ状態)
│   ├── lib/
│   │   ├── auth.ts          # withAuth() APIガード
│   │   ├── cognito.ts       # JWT検証 & トークン更新
│   │   ├── prisma.ts        # Prisma Clientシングルトン
│   │   ├── image.ts         # S3キー ↔ CloudFront URL変換
│   │   ├── s3.ts            # S3サーバー削除ユーティリティ
│   │   ├── clientUpload.ts  # クライアントWebP圧縮＆直接S3アップロード
│   │   └── utils.ts
│   └── types/
```

---

## 4. 厳格な開発ルール・設計原則

1. **認証・認可**:
   - すべてのAPIは `withAuth(request, handler)` を通過させ、サーバー側で `auth.userId` を検証する。
   - 他グループのデータへの不正アクセスを防ぐため、`checkGroupMembership(auth.userId, groupId)` を必ず確認する。
   - レシピの編集・削除は登録者本人（`recipe.createdBy === auth.userId`）のみに制限する。
2. **グループとともだちの分離**:
   - グループとともだちは独立した概念。ともだちであることだけでグループ内データを閲覧させてはならない。
   - レシピをともだちに共有する場合は `RecipeFriendShare` 中間テーブルを利用する。
3. **画像・S3取り扱い**:
   - DBには完全URLではなく**S3キー**（例: `recipes/{groupId}/{recipeId}/{uuid}.webp`）を保存する。
   - 表示時は必ず `getImageUrl(key)` を通して CloudFront ドメイン（`d2kojew12hdnr2.cloudfront.net`）から配信する。
   - 画像ファイルはDBに直接保存しない。
4. **削除時の整合性**:
   - レシピが削除されても、過去の「料理記録（`CookingRecord`）」が消えないよう、`recipeId` は Nullable かつ `onDelete: SetNull` とする。
5. **UI・レスポンシブ**:
   - スマートフォンでの操作性を最優先（SafeArea対応、指が届きやすいBottomNav、滑らかなアニメーション、ソフトシャドウ）。
   - テーマカラーはふたりばと同一の `#FF6F91`（ピンク系）。

---

*初版作成日: 2026-11-19*

