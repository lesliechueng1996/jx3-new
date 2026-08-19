import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const schoolDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '纯阳',
  type: 'school' as const,
  icon: '/icons/chunyang.png',
  alias: ['纯阳宫'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminSchools = mock(async () => ({
  items: [schoolDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const listAllSchools = mock(async () => [
  {
    id: schoolDetail.id,
    name: schoolDetail.name,
    type: schoolDetail.type,
    icon: schoolDetail.icon,
    alias: schoolDetail.alias,
  },
]);
const createAdminSchool = mock(async () => schoolDetail);
const getAdminSchool = mock(async () => schoolDetail);
const updateAdminSchool = mock(async () => schoolDetail);
const deleteAdminSchool = mock(async () => undefined);

mock.module('@api/application/service/school-service', () => ({
  listAdminSchools,
  listAllSchools,
  createAdminSchool,
  getAdminSchool,
  updateAdminSchool,
  deleteAdminSchool,
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

const { schoolRoute, schoolTag } = await import(
  '@api/interface/endpoint/school-route'
);

const schoolId = schoolDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  schoolRoute.handle(
    new Request(`http://localhost/api/v1/school${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('schoolRoute', () => {
  beforeEach(() => {
    listAdminSchools.mockReset();
    listAllSchools.mockReset();
    createAdminSchool.mockReset();
    getAdminSchool.mockReset();
    updateAdminSchool.mockReset();
    deleteAdminSchool.mockReset();

    listAdminSchools.mockResolvedValue({
      items: [schoolDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    listAllSchools.mockResolvedValue([
      {
        id: schoolDetail.id,
        name: schoolDetail.name,
        type: schoolDetail.type,
        icon: schoolDetail.icon,
        alias: schoolDetail.alias,
      },
    ]);
    createAdminSchool.mockResolvedValue(schoolDetail);
    getAdminSchool.mockResolvedValue(schoolDetail);
    updateAdminSchool.mockResolvedValue(schoolDetail);
    deleteAdminSchool.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(schoolTag).toEqual({
      name: 'school',
      description: 'School API',
    });
  });

  it('lists all schools for users', async () => {
    const response = await jsonRequest('/all');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAllSchools).toHaveBeenCalled();
    expect(body.data).toEqual([
      {
        id: schoolId,
        name: '纯阳',
        type: 'school',
        icon: '/icons/chunyang.png',
        alias: ['纯阳宫'],
      },
    ]);
    expect(body.code).toBe('SUCCESS');
  });

  it('lists schools', async () => {
    const response = await jsonRequest(
      '?page=1&pageSize=20&name=纯&type=school',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminSchools).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a school', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '纯阳',
        type: 'school',
        icon: '/icons/chunyang.png',
        alias: ['纯阳宫'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminSchool).toHaveBeenCalled();
    expect(body.data.id).toBe(schoolId);
  });

  it('gets a school', async () => {
    const response = await jsonRequest(`/${schoolId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminSchool).toHaveBeenCalledWith(schoolId);
    expect(body.data.name).toBe('纯阳');
  });

  it('updates a school', async () => {
    const response = await jsonRequest(`/${schoolId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '纯阳宫' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminSchool).toHaveBeenCalled();
  });

  it('deletes a school', async () => {
    const response = await jsonRequest(`/${schoolId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminSchool).toHaveBeenCalledWith(schoolId);
    expect(body.data).toBeNull();
  });
});
