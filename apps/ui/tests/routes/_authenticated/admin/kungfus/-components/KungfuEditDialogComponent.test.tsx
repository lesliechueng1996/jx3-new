import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminKungfuListItem } from '@/lib/api/admin/admin-kungfus-api';
import { KungfuEditDialogComponent } from '@/routes/_authenticated/admin/kungfus/-components/KungfuEditDialogComponent';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { listAllSchools } = vi.hoisted(() => ({
  listAllSchools: vi.fn(),
}));

vi.mock('@/lib/api/schools-api', () => ({
  schoolsAllQueryKey: ['schools-all'],
  listAllSchools,
}));

const kungfu: AdminKungfuListItem = {
  id: '1',
  name: '紫霞功',
  schoolId: 'school-1',
  schoolName: '纯阳',
  kungfuType: 'attack',
  attackType: 'internal',
  attackMethod: 'ranged',
  formationName: '紫霞',
  formationEffect: '提高内功攻击\n提高会心',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icon.png',
  alias: ['气纯'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('KungfuEditDialogComponent', () => {
  beforeEach(() => {
    listAllSchools.mockReset();
    listAllSchools.mockResolvedValue([
      {
        id: 'school-1',
        name: '纯阳',
        type: 'school',
        icon: null,
        alias: [],
      },
    ]);
  });

  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <KungfuEditDialogComponent
        kungfu={kungfu}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('第一重')).toHaveValue('提高内功攻击');
    expect(screen.getByLabelText('第二重')).toHaveValue('提高会心');
    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '紫霞');
    await user.clear(screen.getByLabelText('图标'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '紫霞',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '紫霞',
      formationEffect: '提高内功攻击\n提高会心',
      isPveExternalRecommended: false,
      isPveInternalRecommended: true,
      isUnlimited: false,
      icon: null,
      alias: ['气纯'],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    renderWithQueryClient(
      <KungfuEditDialogComponent
        kungfu={kungfu}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a kungfu', () => {
    renderWithQueryClient(
      <KungfuEditDialogComponent
        kungfu={null}
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
