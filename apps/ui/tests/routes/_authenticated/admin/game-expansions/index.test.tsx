import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListGameExpansions,
  adminCreateGameExpansion,
  adminUpdateGameExpansion,
  adminDeleteGameExpansion,
  adminListGameSeasons,
  adminCreateGameSeason,
  adminUpdateGameSeason,
  adminDeleteGameSeason,
} = vi.hoisted(() => ({
  adminListGameExpansions: vi.fn(),
  adminCreateGameExpansion: vi.fn(),
  adminUpdateGameExpansion: vi.fn(),
  adminDeleteGameExpansion: vi.fn(),
  adminListGameSeasons: vi.fn(),
  adminCreateGameSeason: vi.fn(),
  adminUpdateGameSeason: vi.fn(),
  adminDeleteGameSeason: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-game-expansions-api', () => ({
  adminListGameExpansions,
  adminCreateGameExpansion,
  adminUpdateGameExpansion,
  adminDeleteGameExpansion,
}));

vi.mock('@/lib/api/admin/admin-game-seasons-api', () => ({
  adminListGameSeasons,
  adminCreateGameSeason,
  adminUpdateGameSeason,
  adminDeleteGameSeason,
}));

const expansionItem = {
  id: 'exp-1',
  name: '江湖',
  description: '描述',
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const seasonItem = {
  id: 'season-1',
  expansionId: 'exp-1',
  name: 'S1',
  description: '赛季描述',
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 1,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

describe('admin game expansions route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListGameExpansions.mockReset();
    adminCreateGameExpansion.mockReset();
    adminUpdateGameExpansion.mockReset();
    adminDeleteGameExpansion.mockReset();
    adminListGameSeasons.mockReset();
    adminCreateGameSeason.mockReset();
    adminUpdateGameSeason.mockReset();
    adminDeleteGameSeason.mockReset();
    adminListGameExpansions.mockResolvedValue({ items: [expansionItem] });
    adminListGameSeasons.mockResolvedValue({ items: [seasonItem] });
  });

  it('lists expansions', async () => {
    await renderApp('/admin/game-expansions');
    expect(await screen.findByText('江湖')).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    adminListGameExpansions.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/game-expansions');
    expect(
      await screen.findByText('加载资料片列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates an expansion', async () => {
    const user = userEvent.setup();
    adminCreateGameExpansion.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '新增资料片' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '万灵山庄');
    fireEvent.change(within(dialog).getByLabelText('起始日期'), {
      target: { value: '2026-01-01' },
    });
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateGameExpansion).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '资料片已创建' }),
      );
    });
  });

  it('edits and deletes expansions', async () => {
    const user = userEvent.setup();
    adminUpdateGameExpansion.mockResolvedValue({ id: 'exp-1' });
    adminDeleteGameExpansion.mockResolvedValue(undefined);

    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateGameExpansion).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(await screen.findByText('S1')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteGameExpansion).toHaveBeenCalledWith('exp-1');
    });
  });

  it('expands a row and manages seasons', async () => {
    const user = userEvent.setup();
    adminCreateGameSeason.mockResolvedValue({ id: 'n' });
    adminUpdateGameSeason.mockResolvedValue({ id: 'season-1' });
    adminDeleteGameSeason.mockResolvedValue(undefined);

    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(await screen.findByText('S1')).toBeInTheDocument();
    expect(adminListGameSeasons).toHaveBeenCalledWith('exp-1');

    await user.click(screen.getByRole('button', { name: '新增赛季' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), 'S2');
    fireEvent.change(within(createDialog).getByLabelText('起始日期'), {
      target: { value: '2024-07-01' },
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(adminCreateGameSeason).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '赛季已创建' }),
      );
    });

    await user.click(screen.getAllByRole('button', { name: '编辑' })[1]);
    const editDialogs = await screen.findAllByRole('dialog');
    const seasonEdit = editDialogs[editDialogs.length - 1];
    await user.click(within(seasonEdit).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateGameSeason).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole('button', { name: '删除' })[1]);
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteGameSeason).toHaveBeenCalledWith('season-1');
    });
  });

  it('shows a season load error', async () => {
    const user = userEvent.setup();
    adminListGameSeasons.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');
    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(
      await screen.findByText('加载赛季列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateGameExpansion.mockRejectedValue(new Error('创建失败'));
    adminUpdateGameExpansion.mockRejectedValue(new Error('更新失败'));
    adminDeleteGameExpansion.mockRejectedValue(new Error('删除失败'));
    adminCreateGameSeason.mockRejectedValue(new Error('创建赛季失败'));
    adminUpdateGameSeason.mockRejectedValue(new Error('更新赛季失败'));
    adminDeleteGameSeason.mockRejectedValue(new Error('删除赛季失败'));

    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '新增资料片' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '万灵山庄');
    fireEvent.change(within(createDialog).getByLabelText('起始日期'), {
      target: { value: '2026-01-01' },
    });
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

    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    await screen.findByText('S1');

    await user.click(screen.getByRole('button', { name: '新增赛季' }));
    const seasonCreate = await screen.findByRole('dialog');
    await user.type(within(seasonCreate).getByLabelText('名称'), 'S2');
    fireEvent.change(within(seasonCreate).getByLabelText('起始日期'), {
      target: { value: '2024-07-01' },
    });
    await user.click(
      within(seasonCreate).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建赛季失败' }),
      );
    });
    await user.click(
      within(seasonCreate).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getAllByRole('button', { name: '编辑' })[1]);
    const seasonEdit = await screen.findByRole('dialog');
    await user.click(within(seasonEdit).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新赛季失败' }),
      );
    });
    await user.click(within(seasonEdit).getByRole('button', { name: '取消' }));

    await user.click(screen.getAllByRole('button', { name: '删除' })[1]);
    const seasonConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(seasonConfirm).getByRole('button', { name: '删除' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除赛季失败' }),
      );
    });
  });

  it('cancels a delete confirmation', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteGameExpansion).not.toHaveBeenCalled();
  });

  it('collapses an expanded row and cancels season deletion', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-expansions');
    await screen.findByText('江湖');

    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(await screen.findByText('S1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '收起赛季' }));
    expect(screen.queryByText('S1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(await screen.findByText('S1')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '删除' })[1]);
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteGameSeason).not.toHaveBeenCalled();
  });
});
