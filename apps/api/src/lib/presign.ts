import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3';
import { config } from '../config';

export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.SPACES_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read', // Restore ACL for public access
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
