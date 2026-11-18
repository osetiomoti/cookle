import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import imageCompression from 'browser-image-compression';

interface S3CredentialsResponse {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
  bucket: string;
  userId: string;
}

/**
 * 画像ファイルをクライアント側でWebP圧縮し、Cognito一時認証を使ってS3に直接アップロードする
 */
export async function uploadImageToS3(
  file: File,
  folder: 'recipes' | 'cooking-records' | 'groups' | 'users',
  customKeyPrefix?: string
): Promise<string> {
  // 1. 画像圧縮（最大幅1200px, WebP）
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1.0,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp',
  });

  // 2. 一時認証情報取得
  const credsRes = await fetch('/api/upload/s3-credentials');
  if (!credsRes.ok) {
    throw new Error('S3認証情報の取得に失敗しました');
  }
  const json = await credsRes.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'S3認証情報が無効です');
  }
  const creds: S3CredentialsResponse = json.data;

  // 3. S3 Client 生成
  const s3 = new S3Client({
    region: creds.region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    },
  });

  // 4. S3キー生成
  const uuid = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const key = customKeyPrefix
    ? `${folder}/${customKeyPrefix}/${uuid}.webp`
    : `${folder}/${creds.userId}/${uuid}.webp`;

  const arrayBuffer = await compressedFile.arrayBuffer();

  // 5. アップロード実行
  await s3.send(
    new PutObjectCommand({
      Bucket: creds.bucket,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: 'image/webp',
    })
  );

  return key;
}

