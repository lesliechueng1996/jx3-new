import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminIdiomListItem } from '@/lib/api/admin/admin-idioms-api';
import { IdiomTableComponent } from '@/routes/_authenticated/admin/idioms/-components/IdiomTableComponent';

const idiom: AdminIdiomListItem = {
  id: '1',
  text: '一心一意',
  pinyin: 'yi1 xin1 yi1 yi4',
  tonePattern: '1114',
  meaning: '专心',
  charCount: 4,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('IdiomTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <IdiomTableComponent
        items={[]}
        pendingIdiomId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无成语数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides meaning when null', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <IdiomTableComponent
        items={[idiom, { ...idiom, id: '2', text: '三心二意', meaning: null }]}
        pendingIdiomId="2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('专心')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(idiom);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(idiom);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <IdiomTableComponent
        items={[]}
        isLoading
        pendingIdiomId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
