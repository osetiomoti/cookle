# CHANGELOG.md — くっくる（Cookcle）更新履歴

---

## [0.2.0] - 2026-11-19

### 🍳 グループなしでの個人利用開始対応（tabereco準拠）
- **初期導線の改善**:
  - 初回ログイン時にグループ作成・参加画面へ強制遷移せず、taberecoと同様に個人利用（マイキッチン）としてそのままホーム画面を表示するように変更
  - グループセットアップ画面（`/group-setup`）に「グループを作らずに始める（個人利用）」スキップボタンを追加
- **データモデル改修**:
  - レシピ、料理記録、献立、買い物リスト、カテゴリ、タグの `groupId` を nullable に変更し、個人所有時の `userId` リレーションを追加
  - DBマイグレーションを Neon PostgreSQL へ適用完了
- **API & UI画面の個人対応**:
  - レシピ作成・一覧・検索でグループ未所属時も個人レシピ・友達共有レシピが利用可能に
  - 料理記録、献立カレンダー、買い物リストをグループ未参加時でも個人モードで保存・チェックできるように改修
  - ログアウトURLを既存アプリ（futariba・tabereco）に合わせて `/`（ルート）に統一

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

