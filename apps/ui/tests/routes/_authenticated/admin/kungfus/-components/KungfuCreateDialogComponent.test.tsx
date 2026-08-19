import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KungfuCreateDialogComponent } from '@/routes/_authenticated/admin/kungfus/-components/KungfuCreateDialogComponent';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { listAllSchools } = vi.hoisted(() => ({
  listAllSchools: vi.fn(),
}));

vi.mock('@/lib/api/schools-api', () => ({
  schoolsAllQueryKey: ['schools-all'],
  listAllSchools,
}));

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
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('KungfuCreateDialogComponent', () => {
  beforeEach(() => {
    listAllSchools.mockReset();
    listAllSchools.mockResolvedValue(schools);
  });

  it('submits a new kungfu and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <KungfuCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), '紫霞功');
    await chooseSelectOption(user, '门派', '纯阳');
    await user.type(screen.getByLabelText('别名'), '气纯，气宗');
    await user.type(screen.getByLabelText('第一重'), '提高内功攻击');
    await user.type(screen.getByLabelText('第二重'), '提高会心');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: null,
      attackMethod: null,
      formationName: null,
      formationEffect: '提高内功攻击\n提高会心',
      isPveExternalRecommended: false,
      isPveInternalRecommended: false,
      isUnlimited: false,
      icon: null,
      alias: ['气纯', '气宗'],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    renderWithQueryClient(
      <KungfuCreateDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form when closed', () => {
    renderWithQueryClient(
      <KungfuCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
