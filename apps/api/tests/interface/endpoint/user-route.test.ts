import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

type UserListResult = {
  items: Array<{
    id: string;
    name: string;
    emailMasked: string;
    role: string | null;
    banned: boolean;
    banReason: string | null;
    banDate: string | null;
    lastLoginIp: string | null;
    providers: string[];
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

const listAdminUsers = mock(
  async (): Promise<UserListResult> => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  }),
);

mock.module('@api/application/service/user-service', () => ({
  listAdminUsers,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
  authProviders: ['credential'],
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({}),
  }),
}));

const { userRoute, userTag } = await import(
  '@api/interface/endpoint/user-route'
);

describe('userRoute', () => {
  beforeEach(() => {
    listAdminUsers.mockReset();
    listAdminUsers.mockResolvedValue({
      items: [
        {
          id: 'u1',
          name: 'Alice',
          emailMasked: 'a***@example.com',
          role: 'admin',
          banned: false,
          banReason: null,
          banDate: null,
          lastLoginIp: '1.1.1.1',
          providers: ['credential'],
          createdAt: '2026-01-01 00:00:00',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('exports an OpenAPI tag', () => {
    expect(userTag).toEqual({
      name: 'user',
      description: 'User API',
    });
  });

  it('lists users', async () => {
    const response = await userRoute.handle(
      new Request('http://localhost/api/v1/user?page=1&pageSize=20'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminUsers).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });
});
