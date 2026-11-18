# API_SPECIFICATION.md — くっくる（Cookcle）API仕様書

---

## 1. 共通仕様

- **認証**: 全APIエンドポイント（`/api/auth/*`を除く）は `withAuth` による Cognito JWT Cookie 認証が必須。未認証時は `401 Unauthorized` を返却。
- **認可**: グループリソース操作時は、リクエスト元ユーザーが該当グループに所属していることを検証。
- **レスポンス形式**:
  - 成功: `{ success: true, data: T }`
  - 失敗: `{ success: false, error: string }`

---

## 2. エンドポイント一覧

### 2-1. 認証・認可 (`/api/auth`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/auth/login` | Cognito Hosted UI へリダイレクト |
| `GET` | `/api/auth/callback` | OAuth2 Codeをトークンに交換しCookie保存 |
| `POST`| `/api/auth/logout` | トークンCookieをクリア |
| `POST`| `/api/auth/refresh`| リフレッシュトークンでセッション更新 |

### 2-2. ユーザー (`/api/users`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/users/me` | ログイン中ユーザーのプロフィール取得 |
| `PATCH`| `/api/users/me` | 名前・アバター更新 |

### 2-3. グループ (`/api/groups`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/groups` | 所属グループ一覧取得 |
| `POST`| `/api/groups` | グループ新規作成（作成者はADMIN） |
| `POST`| `/api/groups/join`| 招待コードでグループに参加 |

### 2-4. ともだち (`/api/friends`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/friends` | 承認済みともだち一覧 |
| `POST`| `/api/friends` | ともだち申請送信 |
| `GET` | `/api/friends/pending` | 受信した未承認申請一覧 |
| `PUT` | `/api/friends/[id]/accept` | ともだち申請を承認 |
| `DELETE`| `/api/friends/[id]` | ともだち関係の解除/拒否 |

### 2-5. レシピ (`/api/recipes`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/recipes` | レシピ一覧・キーワード/カテゴリ/タグ検索 |
| `POST`| `/api/recipes` | レシピ新規作成（材料・手順・共有先含む） |
| `GET` | `/api/recipes/[id]` | レシピ詳細取得 |
| `PUT` | `/api/recipes/[id]` | レシピ編集（作成者本人のみ） |
| `DELETE`| `/api/recipes/[id]` | レシピ論理削除（作成者本人のみ） |

### 2-6. お気に入り (`/api/favorites`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/favorites` | ログインユーザーのお気に入りレシピ一覧 |
| `POST`| `/api/favorites/[recipeId]` | レシピをお気に入りに登録 |
| `DELETE`| `/api/favorites/[recipeId]` | お気に入り解除 |

### 2-7. 料理記録 (`/api/cooking-records`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/cooking-records` | グループ内の料理記録一覧 |
| `POST`| `/api/cooking-records` | 料理記録新規作成（写真・メモ・レシピ紐付け） |
| `GET` | `/api/cooking-records/[id]`| 料理記録詳細 |
| `PUT` | `/api/cooking-records/[id]`| 料理記録編集（本人のみ） |
| `DELETE`| `/api/cooking-records/[id]`| 料理記録削除（本人のみ） |

### 2-8. 献立カレンダー (`/api/meal-plans`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/meal-plans` | 月間献立一覧取得 (`?year=2026&month=11`) |
| `POST`| `/api/meal-plans/items` | 献立アイテムの追加（朝/昼/夕/間食） |
| `DELETE`| `/api/meal-plans/items` | 献立アイテムの削除 (`?itemId=xxx`) |

### 2-9. 買い物リスト (`/api/shopping-lists`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/shopping-lists` | グループの買い物リストと全アイテム取得 |
| `POST`| `/api/shopping-lists/items` | アイテムの追加 |
| `PATCH`| `/api/shopping-lists/items`| 購入完了トグル・アイテム更新 |
| `DELETE`| `/api/shopping-lists/items`| アイテムの削除 (`?itemId=xxx`) |

### 2-10. S3画像アップロード認証 (`/api/upload`)
| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/upload/s3-credentials` | Cognito Identity PoolからS3一時認証情報を取得 |

