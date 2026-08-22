import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListGameDungeons,
  adminCreateGameDungeon,
  adminUpdateGameDungeon,
  adminDeleteGameDungeon,
  adminListGameExpansions,
  adminListGameSeasons,
} = vi.hoisted(() => ({
  adminListGameDungeons: vi.fn(),
  adminCreateGameDungeon: vi.fn(),
  adminUpdateGameDungeon: vi.fn(),
  adminDeleteGameDungeon: vi.fn(),
  adminListGameExpansions: vi.fn(),
  adminListGameSeasons: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminListGameDungeons,
  adminCreateGameDungeon,
  adminUpdateGameDungeon,
  adminDeleteGameDungeon,
}));

vi.mock('@/lib/api/admin/admin-game-expansions-api', () => ({
  adminListGameExpansions,
}));

vi.mock('@/lib/api/admin/admin-game-seasons-api', () => ({
  adminListGameSeasons,
}));

const dungeonItem = {
  id: 'dungeon-1',
  name: '河阳之战',
  expansionId: 'expansion-1',
  expansionName: '剑胆琴心',
  seasonId: 'season-1',
  seasonName: '赛季一',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const expansions = {
  items: [
    {
      id: 'expansion-1',
      name: '剑胆琴心',
      description: null,
      level: 120,
      startDate: '2026-01-01',
      endDate: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
};

const seasons = {
  items: [
    {
      id: 'season-1',
      expansionId: 'expansion-1',
      name: '赛季一',
      description: null,
      startDate: '2026-01-01',
      endDate: null,
      sortOrder: 0,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  label: string,
  option: string,
) => {
  await user.click(within(dialog).getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('admin game dungeons route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListGameDungeons.mockReset();
    adminCreateGameDungeon.mockReset();
    adminUpdateGameDungeon.mockReset();
    adminDeleteGameDungeon.mockReset();
    adminListGameExpansions.mockReset();
    adminListGameSeasons.mockReset();
    adminListGameDungeons.mockResolvedValue({ items: [dungeonItem], total: 1 });
    adminListGameExpansions.mockResolvedValue(expansions);
    adminListGameSeasons.mockResolvedValue(seasons);
  });

  it('lists dungeons', async () => {
    await renderApp('/admin/game-dungeons');
    expect(await screen.findByText('河阳之战')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-dungeons');
    await screen.findByText('河阳之战');

    await user.type(screen.getByLabelText('名称'), '河');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListGameDungeons).toHaveBeenCalledWith(
        expect.objectContaining({ name: '河', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListGameDungeons).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          expansionId: undefined,
          seasonId: undefined,
          difficulty: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListGameDungeons.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/game-dungeons');
    expect(
      await screen.findByText('加载副本列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a dungeon', async () => {
    const user = userEvent.setup();
    adminCreateGameDungeon.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/game-dungeons');
    await screen.findByText('河阳之战');

    await user.click(screen.getByRole('button', { name: '新增副本' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '一之窟');
    await chooseSelectOption(user, dialog, '资料片', '剑胆琴心');
    await chooseSelectOption(user, dialog, '赛季', '赛季一');
    await user.type(within(dialog).getByLabelText('人数'), '10');
    await user.type(within(dialog).getByLabelText('等级'), '120');
    await user.type(within(dialog).getByLabelText('Boss 数量'), '5');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateGameDungeon).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '副本已创建' }),
      );
    });
  });

  it('edits and deletes dungeons', async () => {
    const user = userEvent.setup();
    adminUpdateGameDungeon.mockResolvedValue({ id: 'dungeon-1' });
    adminDeleteGameDungeon.mockResolvedValue(undefined);

    await renderApp('/admin/game-dungeons');
    await screen.findByText('河阳之战');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateGameDungeon).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteGameDungeon).toHaveBeenCalledWith('dungeon-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateGameDungeon.mockRejectedValue(new Error('创建失败'));
    adminUpdateGameDungeon.mockRejectedValue(new Error('更新失败'));
    adminDeleteGameDungeon.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/game-dungeons');
    await screen.findByText('河阳之战');

    await user.click(screen.getByRole('button', { name: '新增副本' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '一之窟');
    await chooseSelectOption(user, createDialog, '资料片', '剑胆琴心');
    await chooseSelectOption(user, createDialog, '赛季', '赛季一');
    await user.type(within(createDialog).getByLabelText('人数'), '10');
    await user.type(within(createDialog).getByLabelText('等级'), '120');
    await user.type(within(createDialog).getByLabelText('Boss 数量'), '5');
    await user.click(
      within(createDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      );
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

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
    await renderApp('/admin/game-dungeons');
    await screen.findByText('河阳之战');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteGameDungeon).not.toHaveBeenCalled();
  });
});
