import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { renderApp } from '../../../helpers/render';
import { userSession } from '../../../helpers/session';

const { getRaidRun, listAllKungfus, listAllGameServers, searchGameDungeons } =
  vi.hoisted(() => ({
    getRaidRun: vi.fn(),
    listAllKungfus: vi.fn(),
    listAllGameServers: vi.fn(),
    searchGameDungeons: vi.fn(),
  }));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunDetailQueryKey: (id: string) => ['raid-run', id],
  createRaidRun: vi.fn(),
  getRaidRun,
  saveRaidRun: vi.fn(),
  updateRaidRunStatus: vi.fn(),
  updateRaidRunGameRaidId: vi.fn(),
  updateRaidRunWages: vi.fn(),
}));

vi.mock('@/lib/api/raid-loots-api', () => ({
  raidRunLootsQueryKey: (id: string) => ['raid-run-loots', id],
  listRaidRunLoots: vi.fn().mockResolvedValue([]),
  createRaidRunLoot: vi.fn(),
  updateRaidRunLoot: vi.fn(),
  deleteRaidRunLoot: vi.fn(),
}));

vi.mock('@/lib/api/game-items-api', () => ({
  gameItemsSearchQueryKey: (name: string) => ['game-items-search', name],
  searchGameItems: vi.fn().mockResolvedValue([]),
  createGameItemQuick: vi.fn(),
}));

describe('raid-run $id route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    getRaidRun.mockReset();
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    searchGameDungeons.mockReset();
    listAllKungfus.mockResolvedValue([]);
    listAllGameServers.mockResolvedValue([]);
    searchGameDungeons.mockResolvedValue([]);
    getRaidRun.mockRejectedValue(new Error('开团记录不存在'));
    useRaidRun.getState().resetRaidRun();
  });

  it('loads a raid run by id', async () => {
    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(await screen.findByText('开团记录不存在')).toBeInTheDocument();
    expect(getRaidRun).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });
});
