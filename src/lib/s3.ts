import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { extractS3Key } from './image';

const IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID ?? '';
const USER_POOL_ID     = process.env.COGNITO_USER_POOL_ID ?? '';
const REGION           = process.env.AWS_REGION ?? 'ap-northeast-1';
const BUCKET           = process.env.AWS_S3_BUCKET_NAME ?? 'cookle-media-prod';

const identityClient = new CognitoIdentityClient({ region: REGION });

/** Cognito Identity Pool経由でS3一時認証情報を取得 */
export async function getS3TemporaryCredentials(idToken: string) {
  const cognitoProviderKey = `cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
  const logins = { [cognitoProviderKey]: idToken };

  const getIdRes = await identityClient.send(new GetIdCommand({
    IdentityPoolId: IDENTITY_POOL_ID,
    Logins: logins,
  }));

  if (!getIdRes.IdentityId) throw new Error('Failed to get Identity ID');

  const credRes = await identityClient.send(new GetCredentialsForIdentityCommand({
    IdentityId: getIdRes.IdentityId,
    Logins: logins,
  }));

  return credRes.Credentials;
}

/** 複数のS3オブジェクトを削除（URLまたはキーの配列を受け取る） */
export async function deleteS3Objects(urlsOrKeys: string[], idToken: string | null): Promise<void> {
  if (!IDENTITY_POOL_ID || !BUCKET || !idToken || urlsOrKeys.length === 0) return;

  const keys = Array.from(
    new Set(urlsOrKeys.map(extractS3Key).filter((k): k is string => !!k))
  );
  if (keys.length === 0) return;

  try {
    const creds = await getS3TemporaryCredentials(idToken);
    if (!creds?.AccessKeyId || !creds?.SecretKey || !creds?.SessionToken) return;

    const s3 = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretKey,
        sessionToken: creds.SessionToken,
      },
    });

    if (keys.length === 1) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: keys[0] }));
    } else {
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.map(Key => ({ Key })) },
      }));
    }
  } catch (e) {
    console.error('[S3] deleteS3Objects failed:', e);
  }
}

