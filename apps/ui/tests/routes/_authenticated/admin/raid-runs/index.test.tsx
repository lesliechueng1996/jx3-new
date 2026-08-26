import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListRaidRuns,
  adminCopyRaidRun,
  adminDeleteRaidRun,
  listAllKungfus,
  getRaidRun,
} = vi.hoisted(() => ({
  adminListRaidRuns: vi.fn(),
  adminCopyRaidRun: vi.fn(),
  adminDeleteRaidRun: vi.fn(),
  listAllKungfus: vi.fn(),
  getRaidRun: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-raid-runs-api', () => ({
  adminListRaidRuns,
  adminCopyRaidRun,
  adminDeleteRaidRun,
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminGameDungeonQueryKey: (id: string) => ['admin-game-dungeon', id],
  adminGetGameDungeon: vi.fn(),
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
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

const raidRunItem = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: '周六团',
  status: 'pending' as const,
  gameRaidId: 'game-1',
  dungeonId: '11111111-1111-4111-8111-111111111111',
  dungeonName: '25人英雄河阳之战',
  startTime: '2026-08-22 21:00',
  endTime: '2026-08-23 00:00',
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  totalIncome: 0,
  wagePerPerson: 0,
  subsidyAmount: 0,
  signupCount: 25,
};

describe('admin raid-runs route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListRaidRuns.mockReset();
    adminCopyRaidRun.mockReset();
    adminDeleteRaidRun.mockReset();
    listAllKungfus.mockReset();
    getRaidRun.mockReset();
    adminListRaidRuns.mockResolvedValue({ items: [raidRunItem], total: 1 });
    listAllKungfus.mockResolvedValue([]);
    getRaidRun.mockRejectedValue(new Error('not needed'));
  });

  it('lists raid runs', async () => {
    await renderApp('/admin/raid-runs');
    expect(await screen.findByText('周六团')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.type(screen.getByLabelText('名称'), '周六');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListRaidRuns).toHaveBeenCalledWith(
        expect.objectContaining({ name: '周六', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListRaidRuns).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          status: undefined,
          dungeonId: undefined,
          startDate: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListRaidRuns.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/raid-runs');
    expect(
      await screen.findByText('加载开团列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('navigates to the create page', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '新建开团' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/raid-run');
    });
  });

  it('navigates to the edit page', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/raid-run/${raidRunItem.id}`,
      );
    });
  });

  it('copies a raid run and navigates to the new page', async () => {
    const user = userEvent.setup();
    const copiedId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    adminCopyRaidRun.mockResolvedValue({ id: copiedId });
    const { router } = await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '复制' }));
    await waitFor(() => {
      expect(adminCopyRaidRun).toHaveBeenCalledWith(raidRunItem.id);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '开团已复制' }),
      );
      expect(router.state.location.pathname).toBe(`/raid-run/${copiedId}`);
    });
  });

  it('toasts copy failures', async () => {
    const user = userEvent.setup();
    adminCopyRaidRun.mockRejectedValue(new Error('复制失败'));
    await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '复制' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '复制失败' }),
      );
    });
  });

  it('deletes a raid run after confirmation', async () => {
    const user = userEvent.setup();
    adminDeleteRaidRun.mockResolvedValue(undefined);
    await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteRaidRun).toHaveBeenCalledWith(raidRunItem.id);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '开团已删除' }),
      );
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminDeleteRaidRun.mockRejectedValue(new Error('删除失败'));
    await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });
  });

  it('cancels a delete confirmation', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/raid-runs');
    await screen.findByText('周六团');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteRaidRun).not.toHaveBeenCalled();
  });
});
