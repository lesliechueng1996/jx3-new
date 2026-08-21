import type {
  StorageService,
  UploadObjectInput,
} from '@api/domain/service/storage-service';
import { env } from '@api/infrastructure/config/env';
import { logger } from '@api/infrastructure/logger';
import { S3Client } from 'bun';

export type S3ObjectHandle = {
  write: (
    data: File | Blob | Uint8Array | ArrayBuffer | string,
    options?: { type?: string },
  ) => Promise<number>;
  delete: () => Promise<void>;
};

export type S3ObjectStore = {
  file: (key: string) => S3ObjectHandle;
};

export const joinPublicObjectUrl = (baseUrl: string, key: string): string => {
  const base = baseUrl.replace(/\/+$/, '');
  const objectKey = key.replace(/^\/+/, '');
  return `${base}/${objectKey}`;
};

export const publicUrlToObjectKey = (
  baseUrl: string,
  url: string,
): string | null => {
  const prefix = `${baseUrl.replace(/\/+$/, '')}/`;
  if (!url.startsWith(prefix)) {
    return null;
  }

  const key = url.slice(prefix.length);
  return key.length > 0 ? key : null;
};

export class BunS3StorageService implements StorageService {
  constructor(
    private readonly client: S3ObjectStore,
    private readonly publicBaseUrl: string,
  ) {}

  async upload(input: UploadObjectInput): Promise<string> {
    try {
      await this.client.file(input.key).write(input.body, {
        type: input.contentType,
      });
    } catch (error) {
      logger.error('S3 upload failed, {key}, {error}', {
        key: input.key,
        error,
      });
      throw error;
    }

    const url = joinPublicObjectUrl(this.publicBaseUrl, input.key);
    logger.info('Uploaded object {key} to {url}', { key: input.key, url });
    return url;
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.file(key).delete();
    } catch (error) {
      logger.error('S3 delete failed, {key}, {error}', { key, error });
      throw error;
    }
    logger.info('Deleted object {key}', { key });
  }

  async deletePublicUrl(url: string): Promise<void> {
    const key = publicUrlToObjectKey(this.publicBaseUrl, url);
    if (!key) {
      return;
    }
    await this.delete(key);
  }
}

let singleton: BunS3StorageService | undefined;

export const getBunS3StorageService = (
  createClient: () => S3ObjectStore = () =>
    new S3Client({
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      bucket: env.S3_BUCKET,
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
    }),
): StorageService => {
  singleton ??= new BunS3StorageService(createClient(), env.S3_PUBLIC_BASE_URL);
  return singleton;
};
