import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListSchools,
  adminCreateSchool,
  adminUpdateSchool,
  adminDeleteSchool,
} = vi.hoisted(() => ({
  adminListSchools: vi.fn(),
  adminCreateSchool: vi.fn(),
  adminUpdateSchool: vi.fn(),
  adminDeleteSchool: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-schools-api', () => ({
  adminListSchools,
  adminCreateSchool,
  adminUpdateSchool,
  adminDeleteSchool,
}));

const schoolItem = {
  id: 'school-1',
  name: '纯阳',
  type: 'school',
  icon: '/icon.png',
  alias: ['纯阳宫'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

describe('admin schools route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListSchools.mockReset();
    adminCreateSchool.mockReset();
    adminUpdateSchool.mockReset();
    adminDeleteSchool.mockReset();
    adminListSchools.mockResolvedValue({ items: [schoolItem], total: 1 });
  });

  it('lists schools', async () => {
    await renderApp('/admin/schools');
    expect(await screen.findByText('纯阳')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/schools');
    await screen.findByText('纯阳');

    await user.type(screen.getByLabelText('名称'), '纯');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListSchools).toHaveBeenCalledWith(
        expect.objectContaining({ name: '纯', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListSchools).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          type: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListSchools.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/schools');
    expect(
      await screen.findByText('加载门派列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a school', async () => {
    const user = userEvent.setup();
    adminCreateSchool.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/schools');
    await screen.findByText('纯阳');

    await user.click(screen.getByRole('button', { name: '新增门派' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '万花');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateSchool).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '门派已创建' }),
      );
    });
  });

  it('edits and deletes schools', async () => {
    const user = userEvent.setup();
    adminUpdateSchool.mockResolvedValue({ id: 'school-1' });
    adminDeleteSchool.mockResolvedValue(undefined);

    await renderApp('/admin/schools');
    await screen.findByText('纯阳');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateSchool).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteSchool).toHaveBeenCalledWith('school-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateSchool.mockRejectedValue(new Error('创建失败'));
    adminUpdateSchool.mockRejectedValue(new Error('更新失败'));
    adminDeleteSchool.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/schools');
    await screen.findByText('纯阳');

    await user.click(screen.getByRole('button', { name: '新增门派' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '万花');
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
    await renderApp('/admin/schools');
    await screen.findByText('纯阳');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteSchool).not.toHaveBeenCalled();
  });
});
