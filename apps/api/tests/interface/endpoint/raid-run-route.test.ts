import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const createRaidRun = mock<
  (body: unknown, userId: string) => Promise<{ id: string }>
>(() => Promise.resolve({ id: 'raid-run-1' }));

mock.module('@api/application/service/raid-run-service', () => ({
  createRaidRun,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({
      resolve: async () => ({
        user: { id: 'actor-1', role: 'user' },
        session: { id: 's1' },
      }),
    }),
  }),
}));

const { raidRunRoute, raidRunTag } = await import(
  '@api/interface/endpoint/raid-run-route'
);

const dungeonId = '11111111-1111-4111-8111-111111111111';

const validBody = {
  name: '周六团',
  dungeonId,
  gatherTime: '2026-08-22T12:00:00.000Z',
  startTime: '2026-08-22T13:00:00.000Z',
  endTime: '2026-08-22T16:00:00.000Z',
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  signups: [
    {
      groupNumber: 1,
      positionNumber: 1,
      role: 'tank',
      isLeader: true,
      isDarkRun: true,
      isFormationCore: true,
      characterName: '团长',
    },
  ],
};

const jsonRequest = (path: string, init?: RequestInit) =>
  raidRunRoute.handle(
    new Request(`http://localhost/api/v1/raid-run${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('raidRunRoute', () => {
  beforeEach(() => {
    createRaidRun.mockReset();
    createRaidRun.mockResolvedValue({ id: 'raid-run-1' });
  });

  it('exports an OpenAPI tag', () => {
    expect(raidRunTag).toEqual({
      name: 'raid-run',
      description: 'Raid Run API',
    });
  });

  it('creates a raid run', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createRaidRun).toHaveBeenCalledTimes(1);
    expect(createRaidRun).toHaveBeenCalledWith(expect.anything(), 'actor-1');
    expect(body.code).toBe('SUCCESS');
    expect(body.data.id).toBe('raid-run-1');
  });

  it('rejects a pending signup role', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        signups: [
          {
            ...validBody.signups[0],
            role: 'pending',
          },
        ],
      }),
    });

    expect(response.status).toBe(422);
    expect(createRaidRun).not.toHaveBeenCalled();
  });

  it('rejects an empty signup list', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        signups: [],
      }),
    });

    expect(response.status).toBe(422);
    expect(createRaidRun).not.toHaveBeenCalled();
  });
});
