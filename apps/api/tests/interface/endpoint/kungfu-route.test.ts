import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const kungfuDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '紫霞功',
  schoolId: '22222222-2222-4222-8222-222222222222',
  schoolName: '纯阳',
  kungfuType: 'attack' as const,
  attackType: 'internal' as const,
  attackMethod: 'ranged' as const,
  formationName: '紫霞',
  formationEffect: '提高内功攻击',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icons/zixia.png',
  alias: ['气纯'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminKungfus = mock(async () => ({
  items: [kungfuDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const listAllKungfus = mock(async () => [
  {
    id: kungfuDetail.id,
    name: kungfuDetail.name,
    schoolId: kungfuDetail.schoolId,
    schoolName: kungfuDetail.schoolName,
    kungfuType: kungfuDetail.kungfuType,
    icon: kungfuDetail.icon,
    alias: kungfuDetail.alias,
  },
]);
const createAdminKungfu = mock(async () => kungfuDetail);
const getAdminKungfu = mock(async () => kungfuDetail);
const updateAdminKungfu = mock(async () => kungfuDetail);
const deleteAdminKungfu = mock(async () => undefined);

mock.module('@api/application/service/kungfu-service', () => ({
  listAdminKungfus,
  listAllKungfus,
  createAdminKungfu,
  getAdminKungfu,
  updateAdminKungfu,
  deleteAdminKungfu,
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

const { kungfuRoute, kungfuTag } = await import(
  '@api/interface/endpoint/kungfu-route'
);

const kungfuId = kungfuDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  kungfuRoute.handle(
    new Request(`http://localhost/api/v1/kungfu${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('kungfuRoute', () => {
  beforeEach(() => {
    listAdminKungfus.mockReset();
    listAllKungfus.mockReset();
    createAdminKungfu.mockReset();
    getAdminKungfu.mockReset();
    updateAdminKungfu.mockReset();
    deleteAdminKungfu.mockReset();

    listAdminKungfus.mockResolvedValue({
      items: [kungfuDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    listAllKungfus.mockResolvedValue([
      {
        id: kungfuDetail.id,
        name: kungfuDetail.name,
        schoolId: kungfuDetail.schoolId,
        schoolName: kungfuDetail.schoolName,
        kungfuType: kungfuDetail.kungfuType,
        icon: kungfuDetail.icon,
        alias: kungfuDetail.alias,
      },
    ]);
    createAdminKungfu.mockResolvedValue(kungfuDetail);
    getAdminKungfu.mockResolvedValue(kungfuDetail);
    updateAdminKungfu.mockResolvedValue(kungfuDetail);
    deleteAdminKungfu.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(kungfuTag).toEqual({
      name: 'kungfu',
      description: 'Kungfu API',
    });
  });

  it('lists all kungfus for users', async () => {
    const response = await jsonRequest('/all');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAllKungfus).toHaveBeenCalled();
    expect(body.data).toEqual([
      {
        id: kungfuId,
        name: '紫霞功',
        schoolId: kungfuDetail.schoolId,
        schoolName: '纯阳',
        kungfuType: 'attack',
        icon: '/icons/zixia.png',
        alias: ['气纯'],
      },
    ]);
    expect(body.code).toBe('SUCCESS');
  });

  it('lists kungfus', async () => {
    const response = await jsonRequest(
      `?page=1&pageSize=20&name=紫&schoolId=${kungfuDetail.schoolId}&kungfuType=attack&attackType=internal&attackMethod=ranged&isUnlimited=false`,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminKungfus).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a kungfu', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '紫霞功',
        schoolId: kungfuDetail.schoolId,
        kungfuType: 'attack',
        attackType: 'internal',
        attackMethod: 'ranged',
        icon: '/icons/zixia.png',
        alias: ['气纯'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminKungfu).toHaveBeenCalled();
    expect(body.data.id).toBe(kungfuId);
  });

  it('gets a kungfu', async () => {
    const response = await jsonRequest(`/${kungfuId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminKungfu).toHaveBeenCalledWith(kungfuId);
    expect(body.data.name).toBe('紫霞功');
  });

  it('updates a kungfu', async () => {
    const response = await jsonRequest(`/${kungfuId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '紫霞' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminKungfu).toHaveBeenCalled();
  });

  it('deletes a kungfu', async () => {
    const response = await jsonRequest(`/${kungfuId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminKungfu).toHaveBeenCalledWith(kungfuId);
    expect(body.data).toBeNull();
  });
});
