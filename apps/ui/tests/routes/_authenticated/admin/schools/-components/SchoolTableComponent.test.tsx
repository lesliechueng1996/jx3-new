import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminSchoolListItem } from '@/lib/api/admin/admin-schools-api';
import { SchoolTableComponent } from '@/routes/_authenticated/admin/schools/-components/SchoolTableComponent';

const school: AdminSchoolListItem = {
  id: '1',
  name: '纯阳',
  type: 'school',
  icon: '/icon.png',
  alias: ['纯阳宫'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('SchoolTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <SchoolTableComponent
        items={[]}
        pendingSchoolId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无门派数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <SchoolTableComponent
        items={[
          school,
          {
            ...school,
            id: '2',
            name: '花间',
            type: 'genre',
            icon: null,
            alias: [],
          },
        ]}
        pendingSchoolId="2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('门派')).toBeInTheDocument();
    expect(screen.getByText('流派')).toBeInTheDocument();
    expect(screen.getByText('纯阳宫')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '纯阳图标' })).toHaveAttribute(
      'src',
      '/icon.png',
    );
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(school);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(school);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <SchoolTableComponent
        items={[]}
        isLoading
        pendingSchoolId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
