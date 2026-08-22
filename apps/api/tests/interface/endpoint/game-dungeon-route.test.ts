import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const dungeonDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '河阳之战',
  expansionId: '22222222-2222-4222-8222-222222222222',
  expansionName: '剑胆琴心',
  seasonId: '33333333-3333-4333-8333-333333333333',
  seasonName: '赛季一',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminGameDungeons = mock(async () => ({
  items: [dungeonDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const createAdminGameDungeon = mock(async () => dungeonDetail);
const getAdminGameDungeon = mock(async () => dungeonDetail);
const updateAdminGameDungeon = mock(async () => dungeonDetail);
const deleteAdminGameDungeon = mock(async () => undefined);

mock.module('@api/application/service/game-dungeon-service', () => ({
  listAdminGameDungeons,
  createAdminGameDungeon,
  getAdminGameDungeon,
  updateAdminGameDungeon,
  deleteAdminGameDungeon,
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

const { gameDungeonRoute, gameDungeonTag } = await import(
  '@api/interface/endpoint/game-dungeon-route'
);

const dungeonId = dungeonDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameDungeonRoute.handle(
    new Request(`http://localhost/api/v1/game-dungeon${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameDungeonRoute', () => {
  beforeEach(() => {
    listAdminGameDungeons.mockReset();
    createAdminGameDungeon.mockReset();
    getAdminGameDungeon.mockReset();
    updateAdminGameDungeon.mockReset();
    deleteAdminGameDungeon.mockReset();

    listAdminGameDungeons.mockResolvedValue({
      items: [dungeonDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    createAdminGameDungeon.mockResolvedValue(dungeonDetail);
    getAdminGameDungeon.mockResolvedValue(dungeonDetail);
    updateAdminGameDungeon.mockResolvedValue(dungeonDetail);
    deleteAdminGameDungeon.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(gameDungeonTag).toEqual({
      name: 'game-dungeon',
      description: 'Game dungeon API',
    });
  });

  it('lists dungeons', async () => {
    const response = await jsonRequest(
      `?page=1&pageSize=20&name=河&expansionId=${dungeonDetail.expansionId}&seasonId=${dungeonDetail.seasonId}&difficulty=heroic`,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameDungeons).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a dungeon', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '河阳之战',
        expansionId: dungeonDetail.expansionId,
        seasonId: dungeonDetail.seasonId,
        playerLimit: 25,
        difficulty: 'heroic',
        levelRequirement: 120,
        bossCount: 6,
        resetWeekdays: [1, 4],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameDungeon).toHaveBeenCalled();
    expect(body.data.id).toBe(dungeonId);
  });

  it('gets a dungeon', async () => {
    const response = await jsonRequest(`/${dungeonId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameDungeon).toHaveBeenCalledWith(dungeonId);
    expect(body.data.name).toBe('河阳之战');
  });

  it('updates a dungeon', async () => {
    const response = await jsonRequest(`/${dungeonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '河阳' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameDungeon).toHaveBeenCalled();
  });

  it('deletes a dungeon', async () => {
    const response = await jsonRequest(`/${dungeonId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameDungeon).toHaveBeenCalledWith(dungeonId);
    expect(body.data).toBeNull();
  });
});
