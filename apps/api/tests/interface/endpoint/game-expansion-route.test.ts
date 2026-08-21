import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const gameExpansionDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '江湖',
  description: '描述',
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminGameExpansions = mock(async () => ({
  items: [gameExpansionDetail],
}));
const createAdminGameExpansion = mock(async () => gameExpansionDetail);
const getAdminGameExpansion = mock(async () => gameExpansionDetail);
const updateAdminGameExpansion = mock(async () => gameExpansionDetail);
const deleteAdminGameExpansion = mock(async () => undefined);

mock.module('@api/application/service/game-expansion-service', () => ({
  listAdminGameExpansions,
  createAdminGameExpansion,
  getAdminGameExpansion,
  updateAdminGameExpansion,
  deleteAdminGameExpansion,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({}),
  }),
}));

const { gameExpansionRoute, gameExpansionTag } = await import(
  '@api/interface/endpoint/game-expansion-route'
);

const expansionId = gameExpansionDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameExpansionRoute.handle(
    new Request(`http://localhost/api/v1/game-expansion${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameExpansionRoute', () => {
  beforeEach(() => {
    listAdminGameExpansions.mockReset();
    createAdminGameExpansion.mockReset();
    getAdminGameExpansion.mockReset();
    updateAdminGameExpansion.mockReset();
    deleteAdminGameExpansion.mockReset();

    listAdminGameExpansions.mockResolvedValue({
      items: [gameExpansionDetail],
    });
    createAdminGameExpansion.mockResolvedValue(gameExpansionDetail);
    getAdminGameExpansion.mockResolvedValue(gameExpansionDetail);
    updateAdminGameExpansion.mockResolvedValue(gameExpansionDetail);
    deleteAdminGameExpansion.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(gameExpansionTag).toEqual({
      name: 'game-expansion',
      description: 'Game expansion API',
    });
  });

  it('lists expansions', async () => {
    const response = await jsonRequest('');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameExpansions).toHaveBeenCalled();
    expect(body.data.items).toEqual([gameExpansionDetail]);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates an expansion', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '江湖',
        level: 120,
        description: '描述',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameExpansion).toHaveBeenCalled();
    expect(body.data.id).toBe(expansionId);
  });

  it('gets an expansion', async () => {
    const response = await jsonRequest(`/${expansionId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameExpansion).toHaveBeenCalledWith(expansionId);
    expect(body.data.name).toBe('江湖');
  });

  it('updates an expansion', async () => {
    const response = await jsonRequest(`/${expansionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '万灵山庄' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameExpansion).toHaveBeenCalled();
  });

  it('deletes an expansion', async () => {
    const response = await jsonRequest(`/${expansionId}`, {
      method: 'DELETE',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameExpansion).toHaveBeenCalledWith(expansionId);
    expect(body.data).toBeNull();
  });
});
