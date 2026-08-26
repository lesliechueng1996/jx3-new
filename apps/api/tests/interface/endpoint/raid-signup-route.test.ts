import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const searchItem = {
  id: '11111111-1111-4111-8111-111111111111',
  characterName: '少侠甲',
  serverId: '22222222-2222-4222-8222-222222222222',
  serverName: '梦江南',
  kungfuId: '33333333-3333-4333-8333-333333333333',
  kungfuName: '紫霞功',
  schoolId: '44444444-4444-4444-8444-444444444444',
  kungfuType: 'attack' as const,
};

const listResult = {
  items: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      raidRunId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      raidRunName: '周六团',
      startTime: '2026-08-22 21:00',
      dungeonName: '25人英雄河阳之战',
      role: 'dps' as const,
      status: 'confirmed' as const,
      isReserved: false,
      isLeader: true,
      isDarkRun: false,
      isFormationCore: false,
      characterName: '少侠甲',
      serverName: '梦江南',
      kungfuName: '紫霞功',
      createdAt: '2026-08-22 21:00',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

const searchRaidSignups = mock(async () => [searchItem]);
const listAdminRaidSignups = mock(async () => listResult);

mock.module('@api/application/service/raid-signup-service', () => ({
  searchRaidSignups,
  listAdminRaidSignups,
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

const { raidSignupRoute, raidSignupTag } = await import(
  '@api/interface/endpoint/raid-signup-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  raidSignupRoute.handle(
    new Request(`http://localhost/api/v1/raid-signup${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('raidSignupRoute', () => {
  beforeEach(() => {
    searchRaidSignups.mockReset();
    listAdminRaidSignups.mockReset();
    searchRaidSignups.mockResolvedValue([searchItem]);
    listAdminRaidSignups.mockResolvedValue(listResult);
  });

  it('exports an OpenAPI tag', () => {
    expect(raidSignupTag).toEqual({
      name: 'raid-signup',
      description: 'Raid Signup API',
    });
  });

  it('searches signups by character name for users', async () => {
    const response = await jsonRequest('/search?name=少侠');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchRaidSignups).toHaveBeenCalledWith('少侠');
    expect(body.data).toEqual([searchItem]);
    expect(body.code).toBe('SUCCESS');
  });

  it('rejects search without a name', async () => {
    const response = await jsonRequest('/search');

    expect(response.status).toBe(422);
    expect(searchRaidSignups).not.toHaveBeenCalled();
  });

  it('lists signups for admins', async () => {
    const response = await jsonRequest(
      '/?page=1&pageSize=20&characterName=少侠&raidRunName=周六&role=dps&flags=leader&flags=darkRun',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminRaidSignups).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      characterName: '少侠',
      raidRunName: '周六',
      role: 'dps',
      flags: ['leader', 'darkRun'],
    });
    expect(body.data).toEqual(listResult);
    expect(body.code).toBe('SUCCESS');
  });

  it('accepts a single flag query value', async () => {
    const response = await jsonRequest('/?page=1&pageSize=20&flags=reserved');

    expect(response.status).toBe(200);
    expect(listAdminRaidSignups).toHaveBeenCalledWith(
      expect.objectContaining({ flags: 'reserved' }),
    );
  });
});
