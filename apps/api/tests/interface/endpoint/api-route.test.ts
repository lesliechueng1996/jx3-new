import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  TooManyRequestsException,
  UnauthorizedException,
} from '@api/shared/exception';
import { Elysia, t } from 'elysia';

const logger = {
  error: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/interface/plugins/auth-macro', () => ({
  authMacro: new Elysia({ name: 'auth-macro' }),
}));

const { apiRoute } = await import('@api/interface/endpoint/api-route');

const app = apiRoute
  .get('/ok', () => ({ ok: true }))
  .get('/throw/400', () => {
    throw new BadRequestException('bad');
  })
  .get('/throw/401', () => {
    throw new UnauthorizedException('no auth');
  })
  .get('/throw/403', () => {
    throw new ForbiddenException('nope');
  })
  .get('/throw/404', () => {
    throw new NotFoundException('missing');
  })
  .get('/throw/409', () => {
    throw new ConflictException('dup');
  })
  .get('/throw/429', () => {
    throw new TooManyRequestsException('slow');
  })
  .get('/throw/500', () => {
    throw new InternalServerErrorException('down');
  })
  .get('/throw/plain', () => {
    throw new Error('boom');
  })
  .post('/validate-custom', ({ body }) => body, {
    body: t.Object({
      name: t.String({
        error: () => '名称不正确',
      }),
    }),
  })
  .post('/validate-default', ({ body }) => body, {
    body: t.Object({
      age: t.Number(),
    }),
  });

const request = (path: string, init?: RequestInit) =>
  app.handle(new Request(`http://localhost/api/v1${path}`, init));

describe('apiRoute onError', () => {
  beforeEach(() => {
    logger.error.mockReset();
  });

  it('maps AppException subclasses to their HTTP statuses', async () => {
    const cases = [
      ['/throw/400', 400],
      ['/throw/401', 401],
      ['/throw/403', 403],
      ['/throw/404', 404],
      ['/throw/409', 409],
      ['/throw/429', 429],
      ['/throw/500', 500],
    ] as const;

    for (const [path, status] of cases) {
      const response = await request(path);
      expect(response.status).toBe(status);
      const body = await response.json();
      expect(body.data).toBeNull();
      expect(body.message).toBeString();
    }
  });

  it('maps unknown errors to 500', async () => {
    const response = await request('/throw/plain');
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      data: null,
    });
  });

  it('maps validation failures with a custom error message', async () => {
    const response = await request('/validate-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 1 }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.message).toBe('名称不正确');
  });

  it('falls back to the first validation message', async () => {
    const response = await request('/validate-default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age: 'nope' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('BAD_REQUEST');
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });
});
