import { beforeEach, describe, expect, it, mock } from 'bun:test';

const logger = {
  error: mock((message: string) => message),
  info: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/config/env', () => ({
  env: {
    S3_ENDPOINT: 'http://localhost:3900',
    S3_REGION: 'garage',
    S3_ACCESS_KEY_ID: 'key',
    S3_SECRET_ACCESS_KEY: 'secret',
    S3_BUCKET: 'avatars',
    S3_PUBLIC_BASE_URL: 'http://avatars.web.garage.localhost:3902',
  },
}));

const {
  BunS3StorageService,
  getBunS3StorageService,
  joinPublicObjectUrl,
  publicUrlToObjectKey,
} = await import('@api/infrastructure/external/storage/bun-s3-storage-service');

describe('joinPublicObjectUrl', () => {
  it('strips extra slashes from the base and key', () => {
    expect(joinPublicObjectUrl('http://cdn.example/', '/user-1/a.png')).toBe(
      'http://cdn.example/user-1/a.png',
    );
  });
});

describe('publicUrlToObjectKey', () => {
  it('returns the object key when the url is under the public base', () => {
    expect(
      publicUrlToObjectKey(
        'http://cdn.example/',
        'http://cdn.example/user-1/a.png',
      ),
    ).toBe('user-1/a.png');
  });

  it('returns null for a foreign url or a bare base url', () => {
    expect(
      publicUrlToObjectKey('http://cdn.example', 'http://other.example/a.png'),
    ).toBeNull();
    expect(
      publicUrlToObjectKey('http://cdn.example', 'http://cdn.example/'),
    ).toBeNull();
  });
});

describe('BunS3StorageService', () => {
  const write = mock(async () => 1);
  const remove = mock(async () => undefined);
  const file = mock(() => ({ write, delete: remove }));
  const client = { file };
  const service = new BunS3StorageService(
    client,
    'http://avatars.web.garage.localhost:3902',
  );

  beforeEach(() => {
    write.mockReset();
    remove.mockReset();
    file.mockReset();
    logger.error.mockReset();
    logger.info.mockReset();
    write.mockResolvedValue(1);
    remove.mockResolvedValue(undefined);
    file.mockReturnValue({ write, delete: remove });
  });

  it('writes the object and returns a public url', async () => {
    const body = new Uint8Array([1, 2, 3]);
    const url = await service.upload({
      key: 'user-1/a.png',
      body,
      contentType: 'image/png',
    });

    expect(file).toHaveBeenCalledWith('user-1/a.png');
    expect(write).toHaveBeenCalledWith(body, { type: 'image/png' });
    expect(url).toBe('http://avatars.web.garage.localhost:3902/user-1/a.png');
    expect(logger.info).toHaveBeenCalled();
  });

  it('logs and rethrows when upload fails', async () => {
    const error = new Error('s3 down');
    write.mockRejectedValue(error);

    await expect(
      service.upload({
        key: 'user-1/a.png',
        body: new Uint8Array([1]),
        contentType: 'image/png',
      }),
    ).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalled();
  });

  it('deletes an object by key', async () => {
    await service.delete('user-1/a.png');
    expect(file).toHaveBeenCalledWith('user-1/a.png');
    expect(remove).toHaveBeenCalled();
  });

  it('logs and rethrows when delete fails', async () => {
    const error = new Error('s3 down');
    remove.mockRejectedValue(error);

    await expect(service.delete('user-1/a.png')).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalled();
  });

  it('deletes by public url when the url belongs to this bucket', async () => {
    await service.deletePublicUrl(
      'http://avatars.web.garage.localhost:3902/user-1/a.png',
    );
    expect(remove).toHaveBeenCalled();
  });

  it('skips delete when the public url is not from this bucket', async () => {
    await service.deletePublicUrl('http://other.example/user-1/a.png');
    expect(file).not.toHaveBeenCalled();
  });
});

describe('getBunS3StorageService', () => {
  it('reuses a singleton', () => {
    const first = getBunS3StorageService();
    const second = getBunS3StorageService();
    expect(first).toBe(second);
  });
});
