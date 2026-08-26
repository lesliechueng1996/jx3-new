import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const { adminListRaidSignups, listAllKungfus, listAllGameServers, getRaidRun } =
  vi.hoisted(() => ({
    adminListRaidSignups: vi.fn(),
    listAllKungfus: vi.fn(),
    listAllGameServers: vi.fn(),
    getRaidRun: vi.fn(),
  }));

vi.mock('@/lib/api/admin/admin-raid-signups-api', () => ({
  adminListRaidSignups,
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
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

const signupItem = {
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
};

describe('admin raid-signups route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    adminListRaidSignups.mockReset();
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    getRaidRun.mockReset();
    adminListRaidSignups.mockResolvedValue({ items: [signupItem], total: 1 });
    listAllKungfus.mockResolvedValue([]);
    listAllGameServers.mockResolvedValue([]);
    getRaidRun.mockRejectedValue(new Error('not needed'));
  });

  it('lists raid signups', async () => {
    await renderApp('/admin/raid-signups');
    expect(await screen.findByText('少侠甲')).toBeInTheDocument();
    expect(screen.getByText('周六团')).toBeInTheDocument();
    expect(screen.getByText('25人英雄河阳之战')).toBeInTheDocument();
    expect(screen.getByText('2026-08-22 21:00')).toBeInTheDocument();
    expect(screen.queryByText('小队位置')).not.toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/raid-signups');
    await screen.findByText('少侠甲');

    await user.type(screen.getByLabelText('角色名'), '少侠');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListRaidSignups).toHaveBeenCalledWith(
        expect.objectContaining({ characterName: '少侠', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListRaidSignups).toHaveBeenCalledWith(
        expect.objectContaining({
          characterName: undefined,
          raidRunName: undefined,
          role: undefined,
          flags: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListRaidSignups.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/raid-signups');
    expect(
      await screen.findByText('加载报名列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('navigates to the raid run from the member name', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/admin/raid-signups');
    await screen.findByText('少侠甲');

    await user.click(screen.getByRole('button', { name: '少侠甲' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/raid-run/${signupItem.raidRunId}`,
      );
    });
  });

  it('navigates to the raid run from the view action', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/admin/raid-signups');
    await screen.findByText('少侠甲');

    await user.click(screen.getByRole('button', { name: '查看开团' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/raid-run/${signupItem.raidRunId}`,
      );
    });
  });
});
