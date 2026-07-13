/**
 * Storage abstraction for creative uploads (spec §6).
 *
 * Uses S3 when S3_BUCKET + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY are set
 * AND @aws-sdk/client-s3 is present in package.json (it currently is NOT, and
 * we must not install it). Otherwise files are written to the local uploads/
 * directory and a local URL is returned. Swap in the S3 branch when the SDK
 * becomes a dependency — the public API stays the same.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface UploadableFile {
  buffer?: Buffer;
  path?: string;
  originalname: string;
  mimetype?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  storage: 's3' | 'local';
}

function s3Available(): boolean {
  if (
    !process.env.S3_BUCKET ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    return false;
  }
  try {
    // Only use S3 if the SDK is already a dependency — never install it here.
    require.resolve('@aws-sdk/client-s3');
    return true;
  } catch {
    return false;
  }
}

export async function uploadCreative(file: UploadableFile): Promise<UploadResult> {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;

  if (s3Available()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    const body = file.buffer || (file.path ? fs.readFileSync(file.path) : Buffer.alloc(0));
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
      })
    );
    const region = process.env.AWS_REGION || 'us-east-1';
    return {
      url: `https://${process.env.S3_BUCKET}.s3.${region}.amazonaws.com/${key}`,
      key,
      storage: 's3',
    };
  }

  // Local fallback: persist under uploads/ (served statically at /uploads).
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const dest = path.join(UPLOADS_DIR, key);
  if (file.buffer) {
    fs.writeFileSync(dest, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, dest);
    fs.unlinkSync(file.path);
  } else {
    throw new Error('uploadCreative: file has neither buffer nor path');
  }
  return { url: `/uploads/${key}`, key, storage: 'local' };
}
