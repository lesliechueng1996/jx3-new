import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const gameServerDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  serverId: 'mengjiangnan',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminGameServers = mock(async () => ({
  items: [gameServerDetail],
}));
const listAllGameServers = mock(async () => [
  {
    id: gameServerDetail.id,
    zone: gameServerDetail.zone,
    name: gameServerDetail.name,
    alias: gameServerDetail.alias,
  },
]);
const createAdminGameServer = mock(async () => gameServerDetail);
const getAdminGameServer = mock(async () => gameServerDetail);
const updateAdminGameServer = mock(async () => gameServerDetail);
const deleteAdminGameServer = mock(async () => undefined);
const syncAdminGameServersFromJx3box = mock(async () => ({
  updatedCount: 1,
  insertedCount: 2,
}));

mock.module('@api/application/service/game-server-service', () => ({
  listAdminGameServers,
  listAllGameServers,
  createAdminGameServer,
  getAdminGameServer,
  updateAdminGameServer,
  deleteAdminGameServer,
  syncAdminGameServersFromJx3box,
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

const { gameServerRoute, gameServerTag } = await import(
  '@api/interface/endpoint/game-server-route'
);

const gameServerId = gameServerDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameServerRoute.handle(
    new Request(`http://localhost/api/v1/game-server${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameServerRoute', () => {
  beforeEach(() => {
    listAdminGameServers.mockReset();
    listAllGameServers.mockReset();
    createAdminGameServer.mockReset();
    getAdminGameServer.mockReset();
    updateAdminGameServer.mockReset();
    deleteAdminGameServer.mockReset();
    syncAdminGameServersFromJx3box.mockReset();

    listAdminGameServers.mockResolvedValue({
      items: [gameServerDetail],
    });
    listAllGameServers.mockResolvedValue([
      {
        id: gameServerDetail.id,
        zone: gameServerDetail.zone,
        name: gameServerDetail.name,
        alias: gameServerDetail.alias,
      },
    ]);
    createAdminGameServer.mockResolvedValue(gameServerDetail);
    getAdminGameServer.mockResolvedValue(gameServerDetail);
    updateAdminGameServer.mockResolvedValue(gameServerDetail);
    deleteAdminGameServer.mockResolvedValue(undefined);
    syncAdminGameServersFromJx3box.mockResolvedValue({
      updatedCount: 1,
      insertedCount: 2,
    });
  });

  it('exports an OpenAPI tag', () => {
    expect(gameServerTag).toEqual({
      name: 'game-server',
      description: 'Game server API',
    });
  });

  it('lists all game servers for users', async () => {
    const response = await jsonRequest('/all');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAllGameServers).toHaveBeenCalled();
    expect(body.data).toEqual([
      {
        id: gameServerId,
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      },
    ]);
    expect(body.code).toBe('SUCCESS');
  });

  it('lists game servers', async () => {
    const response = await jsonRequest('');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameServers).toHaveBeenCalled();
    expect(body.data.items).toEqual([gameServerDetail]);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a game server', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        serverId: 'mengjiangnan',
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameServer).toHaveBeenCalled();
    expect(body.data.id).toBe(gameServerId);
  });

  it('gets a game server', async () => {
    const response = await jsonRequest(`/${gameServerId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameServer).toHaveBeenCalledWith(gameServerId);
    expect(body.data.name).toBe('梦江南');
  });

  it('updates a game server', async () => {
    const response = await jsonRequest(`/${gameServerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '绝代' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameServer).toHaveBeenCalled();
  });

  it('deletes a game server', async () => {
    const response = await jsonRequest(`/${gameServerId}`, {
      method: 'DELETE',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameServer).toHaveBeenCalledWith(gameServerId);
    expect(body.data).toBeNull();
  });

  it('syncs game servers', async () => {
    const response = await jsonRequest('/sync', { method: 'POST' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(syncAdminGameServersFromJx3box).toHaveBeenCalled();
    expect(body.data).toEqual({ updatedCount: 1, insertedCount: 2 });
  });
});
