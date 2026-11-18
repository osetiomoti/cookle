# TECHNICAL_DOCUMENTATION.md — くっくる（Cookcle）技術詳細・インフラ仕様書

---

## 1. インフラ・クラウド構成

```
[クライアント (ブラウザ / PWA)]
   │
   ├── (認証) ───────────────> AWS Cognito Hosted UI
   │                             │ (OAuth2 Code)
   │                             ▼
   ├── (API・SSR) ───────────> Next.js App Router (Vercel)
   │                             │
   │                             ├── (Prisma ORM) ───> Neon PostgreSQL
   │                             │                      (ep-wild-cherry)
   │                             └── (Identity Pool) ─> AWS Cognito Identity Pool
   │                                                     (ap-northeast-1:0c22009f...)
   ├── (画像直接アップロード) ──> AWS S3 (`cookle-media-prod`)
   │
   └── (画像配信・CDN) ───────> Amazon CloudFront (`d2kojew12hdnr2.cloudfront.net`)
```

---

## 2. AWSリソース詳細

### 2-1. Amazon Cognito (認証 & S3認可)
- **リージョン**: `ap-northeast-1` (東京)
- **User Pool ID**: `ap-northeast-1_P9v7l08y2`
- **App Client ID**: `4j8gbu1ia2304g2eu534cgl9me`
- **Cognito Domain**: `ap-northeast-1p9v7l08y2.auth.ap-northeast-1.amazoncognito.com`
- **Identity Pool ID**: `ap-northeast-1:0c22009f-6b95-4f2f-aea1-cf0734e55d2b`

### 2-2. AWS S3 (`cookle-media-prod`)
- **バケット名**: `cookle-media-prod`
- **保存キー構造**:
  - `recipes/{groupId}/{recipeId}/{uuid}.webp`
  - `recipes/{groupId}/{recipeId}/steps/{stepNo}_{uuid}.webp`
  - `cooking-records/{groupId}/{recordId}/{uuid}.webp`
  - `groups/{groupId}/icon/{uuid}.webp`
  - `users/{userId}/avatar/{uuid}.webp`
- **アップロード処理**:
  - `browser-image-compression` によりクライアント側で最大幅 1280px、品質制御された WebP 形式に自動圧縮。
  - Cognito Identity Pool から発行された一時クレデンシャル（有効期限付き STS トークン）を用い、S3 バケットへ直接 `PutObject` 実行。サーバーの帯域・メモリを消費しない設計。

### 2-3. Amazon CloudFront
- **ドメイン**: `d2kojew12hdnr2.cloudfront.net`
- S3 `cookle-media-prod` のオリジンに接続され、グローバルエッジキャッシュにより高速配信。

---

## 3. データベース（Neon PostgreSQL）

- **エンドポイント**: `ep-wild-cherry-aoldxrjf`
- **接続構成**:
  - `DATABASE_URL`: `postgresql://neondb_owner:***@ep-wild-cherry-aoldxrjf-pooler.c-2.ap-southeast-1.aws.neon.tech/cookle?sslmode=require&channel_binding=require`
  - `DIRECT_URL`: `postgresql://neondb_owner:***@ep-wild-cherry-aoldxrjf.c-2.ap-southeast-1.aws.neon.tech/cookle?sslmode=require`
- PgBouncer プーラーによるコネクション枯渇防止。

---

## 4. UI・デザインシステム設計

- **カラーパレット**:
  - Primary: `#FF6F91`（ふたりば統一カラー）
  - Primary Light: `#FFE0E8`
  - Surface: `#FFF8FA`
  - Background: `#FFFFFF`
  - Text: `#1A1A2E`
- **角丸ルール**:
  - カード要素: `rounded-card` (20px)
  - モーダル・バナー: `rounded-3xl` (24px)
  - ボタン・入力欄: `rounded-2xl` (16px)
  - バッジ・ピル: `rounded-full`
- **モバイル最適化**:
  - `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` の余白組み込み。
  - スクロールバー非表示、タップ時ハイライト抑止。

