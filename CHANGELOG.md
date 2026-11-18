# CHANGELOG.md — くっくる（Cookcle）更新履歴

---

## [0.1.0] - 2026-11-19

### 🚀 初期リリース・フルスタック基盤完成

#### 追加機能
- **プロジェクト環境構築**:
  - Next.js 15.5.14 (App Router) + React 19 + TypeScript 5.7 + Tailwind CSS 3.4
  - `.npmrc` (legacy-peer-deps=true) 設定
- **データベース & ORM**:
  - Prisma 6.3.1 + Neon PostgreSQL
  - User, Group, GroupMember, Friendship, Recipe, RecipeIngredient, RecipeStep, RecipeTag, RecipeFriendShare, Favorite, FavoriteFolder, CookingRecord, CookingRecordPhoto, MealPlan, MealPlanItem, ShoppingList, ShoppingListItem 等の全テーブル設計
- **AWS インフラ連携**:
  - AWS Cognito Hosted UI 認証 (OAuth2 Authorization Code Flow)
  - AWS Cognito Identity Pool STS 一時認証情報発行 (`/api/upload/s3-credentials`)
  - AWS S3 バケット (`cookle-media-prod`) への直接画像アップロード & クライアント WebP 自動圧縮
  - Amazon CloudFront (`d2kojew12hdnr2.cloudfront.net`) による高速画像配信
- **主要画面 & 機能**:
  - ログイン画面 (`/login`): セッション自動復元機能
  - グループセットアップ画面 (`/group-setup`): 新規作成・招待コード参加
  - ホーム画面 (`/home`): 今日の献立、クイックアクション、最近のレシピ・料理記録
  - レシピ一覧・検索画面 (`/recipes`): キーワード、カテゴリ、タグ、お気に入り、ともだち共有切り替え
  - レシピ投稿画面 (`/recipes/new`): 写真アップロード、材料・手順の動的追加、ともだち共有
  - レシピ詳細画面 (`/recipes/[id]`): 人数変更による材料自動計算、手順チェックリスト、お気に入りトグル
  - 料理記録画面 (`/cooking-records`): 写真付き記録投稿、レシピ連動
  - 献立カレンダー画面 (`/meal-plans`): 月間カレンダー、朝・昼・夕・間食の登録
  - 買い物リスト画面 (`/shopping-lists`): 共有リアルタイムチェックリスト
  - マイページ画面 (`/mypage`): プロフィール編集、ログアウト
  - グループ管理画面 (`/groups`): 招待コードコピー、グループ切り替え
  - ともだち管理画面 (`/friends`): 申請、承認、解除、ユーザーIDコピー
- **ドキュメント**:
  - AI_CONTEXT.md, README.md, APP_OVERVIEW.md, APP_SPECIFICATION.md, DATABASE_SPECIFICATION.md, API_SPECIFICATION.md, TECHNICAL_DOCUMENTATION.md, IMPLEMENTATION_STATUS.md, CHANGELOG.md を作成

