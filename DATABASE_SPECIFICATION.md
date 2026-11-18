# DATABASE_SPECIFICATION.md — くっくる（Cookcle）データベース設計仕様書

---

## 1. 概要

- **RDBMS**: PostgreSQL (Neon Serverless)
- **接続方式**:
  - `DATABASE_URL`: Connection Pooler 経由（アプリケーション実行用）
  - `DIRECT_URL`: Direct 接続（Prisma Migrate / db push 用）
- **ORM**: Prisma Client 6.3.1

---

## 2. テーブル（エンティティ）一覧

| テーブル名 (DB物理名) | Prismaモデル | 用途 |
|---|---|---|
| `users` | `User` | ユーザー情報（Cognito Sub紐付け） |
| `groups` | `Group` | グループ情報・招待コード |
| `group_members` | `GroupMember` | グループ所属メンバー・ロール（ADMIN / MEMBER） |
| `friendships` | `Friendship` | ともだち関係（PENDING / ACCEPTED / REJECTED） |
| `categories` | `Category` | レシピカテゴリ（グループ単位） |
| `tags` | `Tag` | レシピタグ（グループ単位） |
| `recipes` | `Recipe` | レシピ本体情報・作成者紐付け |
| `recipe_ingredients` | `RecipeIngredient` | 材料・分量・単位・並び順 |
| `recipe_steps` | `RecipeStep` | 手順番号・説明・工程写真 |
| `recipe_tags` | `RecipeTag` | レシピ×タグ中間テーブル |
| `recipe_friend_shares`| `RecipeFriendShare`| ともだち個別共有中間テーブル |
| `favorites` | `Favorite` | ユーザー個人のお気に入り（レシピ紐付け） |
| `favorite_folders` | `FavoriteFolder` | お気に入りフォルダ（将来拡張用） |
| `cooking_records` | `CookingRecord` | 料理記録（レシピ任意紐付け） |
| `cooking_record_photos`| `CookingRecordPhoto`| 料理写真・並び順 |
| `meal_plans` | `MealPlan` | 日付ごとの献立（グループ単位） |
| `meal_plan_items` | `MealPlanItem` | 献立アイテム（朝・昼・夕・間食） |
| `shopping_lists` | `ShoppingList` | 買い物リスト（グループ単位） |
| `shopping_list_items` | `ShoppingListItem` | 買い物アイテム・購入ステータス |
| `push_subscriptions` | `PushSubscription` | Web Push通知トークン |

---

## 3. 主要なリレーションと整合性ルール

1. **レシピ削除時の料理記録保護**:
   - `cooking_records.recipe_id` は `Recipe` に対し `onDelete: SetNull`。
   - レシピが削除されても、過去に作った料理記録のログは一切破損しない。
2. **グループ単位のカスケード削除**:
   - `Group` 削除時は所属メンバー、カテゴリ、タグ、献立、買い物リストが `onDelete: Cascade` でクリーンアップ。
3. **お気に入りの個人分離**:
   - `Favorite` は `@@unique([userId, recipeId])` で制約。
   - 他のグループメンバーのお気に入り状態とは完全に独立。
4. **招待コードのユニーク制約**:
   - `groups.invite_code` は `@unique`。8文字の英数字大文字で生成。

