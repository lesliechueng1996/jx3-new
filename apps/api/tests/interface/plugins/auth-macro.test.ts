import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ERROR_CODES } from '@api/shared/exception';
import { Elysia } from 'elysia';

const logger = {
  error: mock((message: string) => message),
};
const getSession = mock(async () => null as SessionResult);

type SessionResult = {
  user: { id: string; role: string | null };
  session: { id: string };
} | null;

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/shared/util/auth', () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

const { authMacro } = await import('@api/interface/plugins/auth-macro');

const app = new Elysia()
  .use(authMacro)
  .get('/user', ({ user, session }) => ({ user, session }), {
    auth: 'user',
  })
  .get('/admin', ({ user }) => ({ user }), {
    auth: 'admin',
  });

describe('authMacro', () => {
  beforeEach(() => {
    logger.error.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue(null);
  });

  it('rejects a missing session', async () => {
    const response = await app.handle(new Request('http://localhost/user'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(logger.error).toHaveBeenCalledWith(
      'Unauthorized access, no session found',
    );
  });

  it('rejects a non-admin on an admin route', async () => {
    getSession.mockResolvedValue({
      user: { id: 'u1', role: 'user' },
      session: { id: 's1' },
    });

    const response = await app.handle(new Request('http://localhost/admin'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(logger.error).toHaveBeenCalledWith(
      'Forbidden access, user is not an admin',
    );
  });

  it('resolves the user for a valid session', async () => {
    getSession.mockResolvedValue({
      user: { id: 'u1', role: 'admin' },
      session: { id: 's1' },
    });

    const userResponse = await app.handle(new Request('http://localhost/user'));
    const adminResponse = await app.handle(
      new Request('http://localhost/admin'),
    );

    expect(userResponse.status).toBe(200);
    expect(await userResponse.json()).toEqual({
      user: { id: 'u1', role: 'admin' },
      session: { id: 's1' },
    });
    expect(adminResponse.status).toBe(200);
  });
});
