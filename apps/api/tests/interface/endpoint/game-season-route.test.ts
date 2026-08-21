import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const gameSeasonDetail = {
  id: '22222222-2222-4222-8222-222222222222',
  expansionId: '11111111-1111-4111-8111-111111111111',
  name: 'S1',
  description: '赛季描述',
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 1,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminGameSeasons = mock(async () => ({
  items: [gameSeasonDetail],
}));
const createAdminGameSeason = mock(async () => gameSeasonDetail);
const getAdminGameSeason = mock(async () => gameSeasonDetail);
const updateAdminGameSeason = mock(async () => gameSeasonDetail);
const deleteAdminGameSeason = mock(async () => undefined);

mock.module('@api/application/service/game-season-service', () => ({
  listAdminGameSeasons,
  createAdminGameSeason,
  getAdminGameSeason,
  updateAdminGameSeason,
  deleteAdminGameSeason,
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

const { gameSeasonRoute, gameSeasonTag } = await import(
  '@api/interface/endpoint/game-season-route'
);

const seasonId = gameSeasonDetail.id;
const expansionId = gameSeasonDetail.expansionId;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameSeasonRoute.handle(
    new Request(`http://localhost/api/v1/game-season${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameSeasonRoute', () => {
  beforeEach(() => {
    listAdminGameSeasons.mockReset();
    createAdminGameSeason.mockReset();
    getAdminGameSeason.mockReset();
    updateAdminGameSeason.mockReset();
    deleteAdminGameSeason.mockReset();

    listAdminGameSeasons.mockResolvedValue({
      items: [gameSeasonDetail],
    });
    createAdminGameSeason.mockResolvedValue(gameSeasonDetail);
    getAdminGameSeason.mockResolvedValue(gameSeasonDetail);
    updateAdminGameSeason.mockResolvedValue(gameSeasonDetail);
    deleteAdminGameSeason.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(gameSeasonTag).toEqual({
      name: 'game-season',
      description: 'Game season API',
    });
  });

  it('lists seasons for an expansion', async () => {
    const response = await jsonRequest(`?expansionId=${expansionId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameSeasons).toHaveBeenCalled();
    expect(body.data.items).toEqual([gameSeasonDetail]);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a season', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        expansionId,
        name: 'S1',
        description: '赛季描述',
        startDate: '2024-06-01',
        endDate: '2024-12-31',
        sortOrder: 1,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameSeason).toHaveBeenCalled();
    expect(body.data.id).toBe(seasonId);
  });

  it('gets a season', async () => {
    const response = await jsonRequest(`/${seasonId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameSeason).toHaveBeenCalledWith(seasonId);
    expect(body.data.name).toBe('S1');
  });

  it('updates a season', async () => {
    const response = await jsonRequest(`/${seasonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'S2' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameSeason).toHaveBeenCalled();
  });

  it('deletes a season', async () => {
    const response = await jsonRequest(`/${seasonId}`, {
      method: 'DELETE',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameSeason).toHaveBeenCalledWith(seasonId);
    expect(body.data).toBeNull();
  });
});
