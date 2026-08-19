import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminKungfuListItem } from '@/lib/api/admin/admin-kungfus-api';
import { KungfuTableComponent } from '@/routes/_authenticated/admin/kungfus/-components/KungfuTableComponent';

const kungfu: AdminKungfuListItem = {
  id: '1',
  name: '紫霞功',
  schoolId: 'school-1',
  schoolName: '纯阳',
  kungfuType: 'attack',
  attackType: 'internal',
  attackMethod: 'ranged',
  formationName: '紫霞',
  formationEffect: '提高内功攻击',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: true,
  icon: '/icon.png',
  alias: ['气纯'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('KungfuTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <KungfuTableComponent
        items={[]}
        pendingKungfuId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无心法数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <KungfuTableComponent
        items={[
          kungfu,
          {
            ...kungfu,
            id: '2',
            name: '铁骨衣',
            schoolName: '天策',
            kungfuType: 'defense',
            attackType: null,
            attackMethod: null,
            isUnlimited: false,
            icon: null,
            alias: [],
          },
        ]}
        pendingKungfuId="2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('攻击')).toBeInTheDocument();
    expect(screen.getByText('防御')).toBeInTheDocument();
    expect(screen.getByText('内功 / 远程')).toBeInTheDocument();
    expect(screen.getByText('气纯')).toBeInTheDocument();
    expect(screen.getAllByText('无界').length).toBeGreaterThan(1);
    expect(screen.getByRole('img', { name: '紫霞功图标' })).toHaveAttribute(
      'src',
      '/icon.png',
    );
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(kungfu);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(kungfu);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <KungfuTableComponent
        items={[]}
        isLoading
        pendingKungfuId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
