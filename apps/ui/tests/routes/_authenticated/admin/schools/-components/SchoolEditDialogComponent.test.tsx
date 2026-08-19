import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminSchoolListItem } from '@/lib/api/admin/admin-schools-api';
import { SchoolEditDialogComponent } from '@/routes/_authenticated/admin/schools/-components/SchoolEditDialogComponent';

const school: AdminSchoolListItem = {
  id: '1',
  name: '纯阳',
  type: 'school',
  icon: '/icon.png',
  alias: ['纯阳宫'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('SchoolEditDialogComponent', () => {
  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SchoolEditDialogComponent
        school={school}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '纯阳宫');
    await user.clear(screen.getByLabelText('图标'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '纯阳宫',
      type: 'school',
      icon: null,
      alias: ['纯阳宫'],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <SchoolEditDialogComponent
        school={school}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a school', () => {
    render(
      <SchoolEditDialogComponent
        school={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
