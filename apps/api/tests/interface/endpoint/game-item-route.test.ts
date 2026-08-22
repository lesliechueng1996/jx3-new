import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const itemDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special' as const,
  quality: 'orange' as const,
  description: '用于装备精炼',
  icon: '/icons/xuanjing.png',
  alias: ['大铁'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminGameItems = mock(async () => ({
  items: [itemDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const createAdminGameItem = mock(async () => itemDetail);
const getAdminGameItem = mock(async () => itemDetail);
const updateAdminGameItem = mock(async () => itemDetail);
const deleteAdminGameItem = mock(async () => undefined);

mock.module('@api/application/service/game-item-service', () => ({
  listAdminGameItems,
  createAdminGameItem,
  getAdminGameItem,
  updateAdminGameItem,
  deleteAdminGameItem,
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

const { gameItemRoute, gameItemTag } = await import(
  '@api/interface/endpoint/game-item-route'
);

const itemId = itemDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameItemRoute.handle(
    new Request(`http://localhost/api/v1/game-item${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameItemRoute', () => {
  beforeEach(() => {
    listAdminGameItems.mockReset();
    createAdminGameItem.mockReset();
    getAdminGameItem.mockReset();
    updateAdminGameItem.mockReset();
    deleteAdminGameItem.mockReset();

    listAdminGameItems.mockResolvedValue({
      items: [itemDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    createAdminGameItem.mockResolvedValue(itemDetail);
    getAdminGameItem.mockResolvedValue(itemDetail);
    updateAdminGameItem.mockResolvedValue(itemDetail);
    deleteAdminGameItem.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(gameItemTag).toEqual({
      name: 'game-item',
      description: 'Game item API',
    });
  });

  it('lists items', async () => {
    const response = await jsonRequest(
      '?page=1&pageSize=20&name=玄&type=special&quality=orange&missingIcon=true',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameItems).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates an item', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '上品玄晶',
        gameItemId: '12345',
        type: 'special',
        quality: 'orange',
        description: '用于装备精炼',
        icon: '/icons/xuanjing.png',
        alias: ['大铁'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameItem).toHaveBeenCalled();
    expect(body.data.id).toBe(itemId);
  });

  it('gets an item', async () => {
    const response = await jsonRequest(`/${itemId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameItem).toHaveBeenCalledWith(itemId);
    expect(body.data.name).toBe('上品玄晶');
  });

  it('updates an item', async () => {
    const response = await jsonRequest(`/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '上品玄晶·改' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameItem).toHaveBeenCalled();
  });

  it('deletes an item', async () => {
    const response = await jsonRequest(`/${itemId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameItem).toHaveBeenCalledWith(itemId);
    expect(body.data).toBeNull();
  });
});
