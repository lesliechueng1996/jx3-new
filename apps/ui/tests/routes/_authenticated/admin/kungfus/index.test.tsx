import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListKungfus,
  adminCreateKungfu,
  adminUpdateKungfu,
  adminDeleteKungfu,
  listAllSchools,
} = vi.hoisted(() => ({
  adminListKungfus: vi.fn(),
  adminCreateKungfu: vi.fn(),
  adminUpdateKungfu: vi.fn(),
  adminDeleteKungfu: vi.fn(),
  listAllSchools: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-kungfus-api', () => ({
  adminListKungfus,
  adminCreateKungfu,
  adminUpdateKungfu,
  adminDeleteKungfu,
}));

vi.mock('@/lib/api/schools-api', () => ({
  listAllSchools,
  schoolsAllQueryKey: ['schools-all'],
}));

const kungfuItem = {
  id: 'kungfu-1',
  name: '紫霞功',
  schoolId: 'school-1',
  schoolName: '纯阳',
  kungfuType: 'attack' as const,
  attackType: 'internal' as const,
  attackMethod: 'ranged' as const,
  formationName: '紫霞',
  formationEffect: '提高内功攻击',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icon.png',
  alias: ['气纯'],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const schools = [
  {
    id: 'school-1',
    name: '纯阳',
    type: 'school' as const,
    icon: null,
    alias: [],
  },
];

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  label: string,
  option: string,
) => {
  await user.click(within(dialog).getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('admin kungfus route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListKungfus.mockReset();
    adminCreateKungfu.mockReset();
    adminUpdateKungfu.mockReset();
    adminDeleteKungfu.mockReset();
    listAllSchools.mockReset();
    adminListKungfus.mockResolvedValue({ items: [kungfuItem], total: 1 });
    listAllSchools.mockResolvedValue(schools);
  });

  it('lists kungfus', async () => {
    await renderApp('/admin/kungfus');
    expect(await screen.findByText('紫霞功')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/kungfus');
    await screen.findByText('紫霞功');

    await user.type(screen.getByLabelText('名称'), '紫');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListKungfus).toHaveBeenCalledWith(
        expect.objectContaining({ name: '紫', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListKungfus).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          schoolId: undefined,
          kungfuType: undefined,
          isUnlimited: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListKungfus.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/kungfus');
    expect(
      await screen.findByText('加载心法列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a kungfu', async () => {
    const user = userEvent.setup();
    adminCreateKungfu.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/kungfus');
    await screen.findByText('紫霞功');

    await user.click(screen.getByRole('button', { name: '新增心法' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '太虚剑意');
    await chooseSelectOption(user, dialog, '门派', '纯阳');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateKungfu).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '心法已创建' }),
      );
    });
  });

  it('edits and deletes kungfus', async () => {
    const user = userEvent.setup();
    adminUpdateKungfu.mockResolvedValue({ id: 'kungfu-1' });
    adminDeleteKungfu.mockResolvedValue(undefined);

    await renderApp('/admin/kungfus');
    await screen.findByText('紫霞功');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateKungfu).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteKungfu).toHaveBeenCalledWith('kungfu-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateKungfu.mockRejectedValue(new Error('创建失败'));
    adminUpdateKungfu.mockRejectedValue(new Error('更新失败'));
    adminDeleteKungfu.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/kungfus');
    await screen.findByText('紫霞功');

    await user.click(screen.getByRole('button', { name: '新增心法' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '太虚剑意');
    await chooseSelectOption(user, createDialog, '门派', '纯阳');
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
    await renderApp('/admin/kungfus');
    await screen.findByText('紫霞功');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteKungfu).not.toHaveBeenCalled();
  });
});
