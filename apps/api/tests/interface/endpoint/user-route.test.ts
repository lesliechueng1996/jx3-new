import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const userDetail = {
  id: 'u1',
  name: 'Alice',
  emailMasked: 'a***@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  lastLoginIp: '1.1.1.1',
  providers: ['credential'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

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
const createAdminUser = mock(async () => userDetail);
const getAdminUser = mock(async () => userDetail);
const updateAdminUser = mock(async () => userDetail);
const deleteAdminUser = mock(async () => undefined);
const banAdminUser = mock(async () => userDetail);
const unbanAdminUser = mock(async () => userDetail);

mock.module('@api/application/service/user-service', () => ({
  listAdminUsers,
  createAdminUser,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  banAdminUser,
  unbanAdminUser,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
  authProviders: ['credential'],
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({
      resolve: async () => ({
        user: { id: 'actor-1', role: 'admin' },
        session: { id: 's1' },
      }),
    }),
  }),
}));

const { userRoute, userTag } = await import(
  '@api/interface/endpoint/user-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  userRoute.handle(
    new Request(`http://localhost/api/v1/user${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('userRoute', () => {
  beforeEach(() => {
    listAdminUsers.mockReset();
    createAdminUser.mockReset();
    getAdminUser.mockReset();
    updateAdminUser.mockReset();
    deleteAdminUser.mockReset();
    banAdminUser.mockReset();
    unbanAdminUser.mockReset();

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
    createAdminUser.mockResolvedValue(userDetail);
    getAdminUser.mockResolvedValue(userDetail);
    updateAdminUser.mockResolvedValue(userDetail);
    deleteAdminUser.mockResolvedValue(undefined);
    banAdminUser.mockResolvedValue(userDetail);
    unbanAdminUser.mockResolvedValue(userDetail);
  });

  it('exports an OpenAPI tag', () => {
    expect(userTag).toEqual({
      name: 'user',
      description: 'User API',
    });
  });

  it('lists users', async () => {
    const response = await jsonRequest('?page=1&pageSize=20');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminUsers).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a user', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password1',
        role: 'user',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminUser).toHaveBeenCalled();
    expect(body.data.id).toBe('u1');
  });

  it('gets a user', async () => {
    const response = await jsonRequest('/u1');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminUser).toHaveBeenCalledWith('u1');
    expect(body.data.emailMasked).toBe('a***@example.com');
  });

  it('updates a user', async () => {
    const response = await jsonRequest('/u1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Alicia' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminUser).toHaveBeenCalled();
  });

  it('deletes a user', async () => {
    const response = await jsonRequest('/u1', { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminUser).toHaveBeenCalled();
    expect(body.data).toBeNull();
  });

  it('bans a user', async () => {
    const response = await jsonRequest('/u1/ban', {
      method: 'POST',
      body: JSON.stringify({ reason: 'spam', banExpiresIn: 60 }),
    });

    expect(response.status).toBe(200);
    expect(banAdminUser).toHaveBeenCalled();
  });

  it('unbans a user', async () => {
    const response = await jsonRequest('/u1/unban', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(unbanAdminUser).toHaveBeenCalledWith('u1', expect.any(Headers));
  });
});
