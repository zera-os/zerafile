import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

export const s3Client = new S3Client({
  endpoint: config.SPACES_ENDPOINT,
  region: config.SPACES_REGION,
  credentials: {
    accessKeyId: config.SPACES_KEY,
    secretAccessKey: config.SPACES_SECRET,
  },
  forcePathStyle: false,
});

export async function headObject(key: string) {
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    return await s3Client.send(new HeadObjectCommand({
      Bucket: config.SPACES_BUCKET,
      Key: key,
    }));
  } catch (error) {
    if (error instanceof Error && 'name' in error && error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
}

export async function putObject(key: string, body: string | Buffer, contentType: string, cacheControl?: string) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  return await s3Client.send(new PutObjectCommand({
    Bucket: config.SPACES_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read',
    CacheControl: cacheControl,
  }));
}

export async function putObjectAcl(key: string, acl: string = 'public-read') {
  const { PutObjectAclCommand } = await import('@aws-sdk/client-s3');
  return await s3Client.send(new PutObjectAclCommand({
    Bucket: config.SPACES_BUCKET,
    Key: key,
    ACL: acl,
  }));
}
