/**
 * 画像URL管理ユーティリティ
 * S3キー ↔ CloudFront URL の変換
 */

const CF_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME ?? 'cookle-media-prod';

/**
 * S3キーまたはURLをCloudFront配信URLに変換
 * - 既にhttp://...で始まる場合はそのまま返す
 * - S3キー（例: "recipes/xxx/yyy.webp"）の場合はCF URLに変換
 */
export function getImageUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return '';
  const trimmed = keyOrUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  return CF_DOMAIN ? `https://${CF_DOMAIN}/${trimmed}` : `/${trimmed}`;
}

/**
 * CloudFront URLをS3キーに変換（DB保存前に使用）
 */
export function toS3Key(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  const trimmed = urlOrKey.trim();
  if (!trimmed) return null;

  // 既にS3キー形式
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }

  // CloudFront URLからキーを抽出
  if (CF_DOMAIN && trimmed.includes(CF_DOMAIN)) {
    const parts = trimmed.split(`${CF_DOMAIN}/`);
    return parts.length > 1 ? parts[1] : null;
  }

  // S3直接URLからキーを抽出
  if (trimmed.includes(`${S3_BUCKET}.s3`)) {
    const regex = new RegExp(`https?://${S3_BUCKET}\\.s3[.-][^/]+/`);
    const key = trimmed.replace(regex, '');
    return key !== trimmed ? key : null;
  }

  return null;
}

/**
 * URLからS3キーを抽出（画像削除時に使用）
 */
export function extractS3Key(url: string): string | null {
  return toS3Key(url);
}

/**
 * S3キーの配列を全てCloudFront URLに変換
 */
export function getImageUrls(keysOrUrls: (string | null | undefined)[] | null | undefined): string[] {
  if (!keysOrUrls) return [];
  return keysOrUrls.map(getImageUrl).filter(Boolean);
}

