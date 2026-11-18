# IMPLEMENTATION_STATUS.md — くっくる（Cookcle）実装状況管理表

---

## 📊 実装進捗サマリー

| 機能区分 | 実装状態 | 備考 |
|---|---|---|
| **基本設定・環境基盤** | ✅ 完了 | Next.js 15, React 19, TS, Tailwind, ESLint, .npmrc |
| **AWS Cognito 認証** | ✅ 完了 | Hosted UI, Callback, Logout, Refresh, iOS PWA対応 |
| **Neon DB & Prisma** | ✅ 完了 | スキーマ設計, withAuthガード, プーラー/ダイレクト接続 |
| **S3 & CloudFront 画像** | ✅ 完了 | S3クレデンシャルAPI, WebP圧縮直接アップロード, CDN配信 |
| **共通UIデザイン** | ✅ 完了 | Header, BottomNav, Button, Card, Modal, Input, Toast |
| **グループ管理** | ✅ 完了 | 新規作成, 招待コード参加, メンバー一覧, 切り替え |
| **ともだち機能** | ✅ 完了 | 申請, 承認, 一覧, 解除, レシピ共有 |
| **レシピ管理** | ✅ 完了 | 投稿, 編集, 削除, 一覧検索, 人数自動計算, 手順チェック |
| **お気に入り機能** | ✅ 完了 | 個人お気に入りトグル, 一覧画面 |
| **料理記録** | ✅ 完了 | レシピ連動記録, 自由記録, 写真アップロード, メモ |
| **献立カレンダー** | ✅ 完了 | 月間カレンダー, 朝昼夕夜アイテム登録・レシピ紐付け |
| **買い物リスト** | ✅ 完了 | 共有チェックリスト, リアルタイム購入完了トグル |
| **ドキュメント整備** | ✅ 完了 | AI_CONTEXT含む全9種類を完備 |

---

## 🔍 詳細機能チェックリスト

### 1. 認証・ユーザー
- [x] Cognito Hosted UI ログイン (`/api/auth/login`)
- [x] OAuth2 トークン交換コールバック (`/api/auth/callback`)
- [x] リフレッシュトークン更新 (`/api/auth/refresh`)
- [x] ログアウト処理 (`/api/auth/logout`)
- [x] セッション自動維持 (`SessionKeepAlive`)
- [x] プロフィール取得・更新 (`/api/users/me`)

### 2. グループ＆ともだち
- [x] グループ一覧取得 (`GET /api/groups`)
- [x] グループ新規作成 (`POST /api/groups`)
- [x] 招待コードでグループ参加 (`POST /api/groups/join`)
- [x] ともだち申請 (`POST /api/friends`)
- [x] 申請中のリクエスト承認 (`PUT /api/friends/[id]/accept`)
- [x] ともだち一覧 (`GET /api/friends`)
- [x] ともだち解除 (`DELETE /api/friends/[id]`)

### 3. レシピ
- [x] レシピ一覧・キーワード/カテゴリ/タグ検索 (`GET /api/recipes`)
- [x] レシピ新規作成 (`POST /api/recipes`)
- [x] レシピ詳細取得 (`GET /api/recipes/[id]`)
- [x] レシピ編集（本人のみ） (`PUT /api/recipes/[id]`)
- [x] レシピ論理削除（本人のみ） (`DELETE /api/recipes/[id]`)
- [x] 人数変更時の材料分量自動倍率計算
- [x] 手順完了チェック機能

### 4. 料理記録
- [x] グループ料理記録一覧 (`GET /api/cooking-records`)
- [x] 料理記録新規作成 (`POST /api/cooking-records`)
- [x] 料理記録編集・削除 (`PUT/DELETE /api/cooking-records/[id]`)

### 5. 献立カレンダー
- [x] 月間献立一覧 (`GET /api/meal-plans`)
- [x] 献立アイテム追加 (`POST /api/meal-plans/items`)
- [x] 献立アイテム削除 (`DELETE /api/meal-plans/items`)

### 6. 買い物リスト
- [x] 買い物リスト・アイテム取得 (`GET /api/shopping-lists`)
- [x] アイテム追加 (`POST /api/shopping-lists/items`)
- [x] 購入完了トグル (`PATCH /api/shopping-lists/items`)
- [x] アイテム削除 (`DELETE /api/shopping-lists/items`)

