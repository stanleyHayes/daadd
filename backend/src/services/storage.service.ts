/**
 * Storage abstraction for creative uploads (spec §6).
 *
 * Provider is chosen by STORAGE_PROVIDER (cloudinary | s3 | local). When unset
 * or set to a provider that isn't configured, we auto-detect: Cloudinary if the
 * CLOUDINARY_* vars are set, then S3 if the AWS vars are set, otherwise the
 * local uploads/ directory. Each cloud branch also requires its SDK to be an
 * installed dependency (guarded require) — `cloudinary` ships as a dependency;
 * `@aws-sdk/client-s3` does not, so the S3 branch stays dormant until it does.
 * The public API stays the same regardless of provider.
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

export type StorageProvider = 'cloudinary' | 's3' | 'local';

export interface UploadResult {
  url: string;
  key: string;
  storage: StorageProvider;
}

function cloudinaryAvailable(): boolean {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return false;
  }
  try {
    // `cloudinary` is a declared dependency, but guard the require so a missing
    // install falls back to local instead of crashing the upload route.
    require.resolve('cloudinary');
    return true;
  } catch {
    return false;
  }
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

/**
 * Resolve the active provider. An explicit STORAGE_PROVIDER is honored only when
 * that provider is actually configured; otherwise we degrade gracefully rather
 * than failing every upload.
 */
function resolveProvider(): StorageProvider {
  const preferred = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();
  if (preferred === 'cloudinary' && cloudinaryAvailable()) return 'cloudinary';
  if (preferred === 's3' && s3Available()) return 's3';
  if (preferred === 'local') return 'local';
  if (cloudinaryAvailable()) return 'cloudinary';
  if (s3Available()) return 's3';
  return 'local';
}

async function uploadToCloudinary(
  file: UploadableFile,
  key: string
): Promise<UploadResult> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { v2: cloudinary } = require('cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: process.env.CLOUDINARY_SECURE !== 'false',
  });

  // public_id excludes the extension; resource_type 'auto' handles image/video.
  const publicId = key.replace(/\.[^.]+$/, '');
  const options = {
    resource_type: 'auto' as const,
    folder: process.env.CLOUDINARY_FOLDER || 'daadd/creatives',
    public_id: publicId,
    overwrite: false,
  };

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (err: unknown, res: { secure_url: string; public_id: string } | undefined) => {
          if (err || !res) return reject(err || new Error('Cloudinary upload returned no result'));
          resolve(res);
        }
      );
      const body =
        file.buffer || (file.path ? fs.readFileSync(file.path) : Buffer.alloc(0));
      stream.end(body);
    }
  );
  if (file.path) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      /* best-effort cleanup of any temp file */
    }
  }
  return { url: result.secure_url, key: result.public_id, storage: 'cloudinary' };
}

export async function uploadCreative(file: UploadableFile): Promise<UploadResult> {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;
  const provider = resolveProvider();

  if (provider === 'cloudinary') {
    return uploadToCloudinary(file, key);
  }

  if (provider === 's3') {
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
