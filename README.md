# くっくる（Cookcle）🍳

みんなでレシピを共有して、毎日の料理をもっと楽しくするWebアプリ。

---

## 📖 概要

「くっくる」は、家族・恋人・友人などのグループでレシピや献立、買い物リスト、料理記録を一元管理できるWebアプリケーションです。
既存アプリ「ふたりば」「tabereco」の技術設計・UI/UX思想を引き継ぎ、統一感のある高品質な体験を提供します。

---

## ✨ 主な機能

1. **レシピ管理**
   - 写真、調理時間、何人分、難易度、カテゴリ、タグの登録
   - 材料・作り方手順の動的追加・編集
   - **人数変更による材料分量自動計算**
   - 作り方手順のチェックリスト機能
2. **料理記録**
   - レシピに紐づく調理写真・感想メモの記録
   - レシピなしの自由な料理記録対応
3. **献立カレンダー**
   - カレンダーでの月間献立管理
   - 朝食・昼食・夕食・間食の区分ごとの複数レシピ/メモ登録
4. **買い物リスト**
   - グループ共有リアルタイムチェックリスト
   - 未購入・購入済みのトグル管理
5. **グループ＆ともだち**
   - 8文字の招待コードによる簡単グループ参加
   - ともだち申請・承認とレシピの個別共有
6. **お気に入り**
   - ユーザー個人単位のお気に入り保存

---

## 🛠 技術スタック

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL, Prisma ORM
- **Auth**: AWS Cognito (Hosted UI / OAuth2)
- **Storage & CDN**: AWS S3 (`cookle-media-prod`), Amazon CloudFront (`d2kojew12hdnr2.cloudfront.net`)

---

## 🚀 開発環境の起動

```bash
# 依存関係のインストール
npm install

# Prisma Client生成 & DBマイグレーション
npm run db:generate
npm run db:push

# 開発サーバー起動 (デフォルト: http://localhost:3100)
npm run dev
```

---

## 📚 ドキュメント

- [AI_CONTEXT.md](./AI_CONTEXT.md) - AI開発コンテキスト（Antigravity必読）
- [APP_OVERVIEW.md](./APP_OVERVIEW.md) - アプリ概要・コンセプト
- [APP_SPECIFICATION.md](./APP_SPECIFICATION.md) - アプリ機能詳細仕様
- [DATABASE_SPECIFICATION.md](./DATABASE_SPECIFICATION.md) - データベース設計仕様
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API仕様書
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - 技術構成・インフラ仕様
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - 実装ステータス
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
