import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListIdiomsPagination,
  adminDeleteIdiom,
  adminCreateIdiom,
  adminGetIdiomDetail,
  adminUpdateIdiom,
  adminImportIdiomsFromCsvFile,
} = vi.hoisted(() => ({
  adminListIdiomsPagination: vi.fn(),
  adminDeleteIdiom: vi.fn(),
  adminCreateIdiom: vi.fn(),
  adminGetIdiomDetail: vi.fn(),
  adminUpdateIdiom: vi.fn(),
  adminImportIdiomsFromCsvFile: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-idioms-api', () => ({
  adminListIdiomsPagination,
  adminDeleteIdiom,
  adminCreateIdiom,
  adminGetIdiomDetail,
  adminUpdateIdiom,
  adminImportIdiomsFromCsvFile,
}));

const idiom = {
  id: '1',
  text: '一心一意',
  pinyin: 'yi1 xin1 yi1 yi4',
  tonePattern: '1114',
  meaning: '专心',
  charCount: 4,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const detail = {
  ...idiom,
  chars: [
    {
      id: 'c1',
      idiomId: '1',
      position: 0,
      char: '一',
      pinyin: 'yi1',
      initial: '',
      final: 'i',
      tone: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
};

describe('admin idioms route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListIdiomsPagination.mockReset();
    adminDeleteIdiom.mockReset();
    adminCreateIdiom.mockReset();
    adminGetIdiomDetail.mockReset();
    adminUpdateIdiom.mockReset();
    adminImportIdiomsFromCsvFile.mockReset();
    adminListIdiomsPagination.mockResolvedValue({ items: [idiom], total: 1 });
    adminGetIdiomDetail.mockResolvedValue(detail);
  });

  it('lists idioms', async () => {
    await renderApp('/admin/idioms');
    expect(await screen.findByText('一心一意')).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    adminListIdiomsPagination.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/idioms');
    expect(
      await screen.findByText('加载成语列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates an idiom', async () => {
    const user = userEvent.setup();
    adminCreateIdiom.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/idioms');
    await screen.findByText('一心一意');

    await user.click(screen.getByRole('button', { name: '新增成语' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('成语'), '三心二意');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateIdiom).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '成语已创建' }),
      );
    });
  });

  it('edits, deletes, and imports idioms', async () => {
    const user = userEvent.setup();
    adminUpdateIdiom.mockResolvedValue({ id: '1' });
    adminDeleteIdiom.mockResolvedValue(undefined);
    adminImportIdiomsFromCsvFile.mockResolvedValue({
      created: 1,
      skipped: 0,
      failed: 0,
    });

    await renderApp('/admin/idioms');
    await screen.findByText('一心一意');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateIdiom).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteIdiom).toHaveBeenCalledWith('1');
    });

    await user.click(screen.getByRole('button', { name: '导入成语' }));
    const importDialog = await screen.findByRole('dialog');
    const file = new File(['text\n一心一意'], 'idioms.csv', {
      type: 'text/csv',
    });
    await user.upload(within(importDialog).getByLabelText('CSV 文件'), file);
    await user.click(
      within(importDialog).getByRole('button', { name: '导入' }),
    );
    await waitFor(() => {
      expect(adminImportIdiomsFromCsvFile).toHaveBeenCalled();
    });
  });

  it('toasts create failures', async () => {
    const user = userEvent.setup();
    adminCreateIdiom.mockRejectedValue(new Error('创建失败'));
    await renderApp('/admin/idioms');
    await screen.findByText('一心一意');
    await user.click(screen.getByRole('button', { name: '新增成语' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('成语'), '三心二意');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      );
    });
  });

  it('toasts update, delete, and import failures', async () => {
    const user = userEvent.setup();
    adminUpdateIdiom.mockRejectedValue(new Error('更新失败'));
    adminDeleteIdiom.mockRejectedValue(new Error('删除失败'));
    adminImportIdiomsFromCsvFile.mockRejectedValue(new Error('导入失败'));

    await renderApp('/admin/idioms');
    await screen.findByText('一心一意');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editAgain = await screen.findByRole('dialog');
    await user.click(within(editAgain).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editAgain).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '导入成语' }));
    const importDialog = await screen.findByRole('dialog');
    await user.upload(
      within(importDialog).getByLabelText('CSV 文件'),
      new File(['x'], 'a.csv', { type: 'text/csv' }),
    );
    await user.click(
      within(importDialog).getByRole('button', { name: '导入' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '导入失败' }),
      );
    });
  });
});
