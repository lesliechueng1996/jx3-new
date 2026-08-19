import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KungfuFormComponent } from '@/routes/_authenticated/admin/kungfus/-components/KungfuFormComponent';
import { emptyFormationEffects } from '@/routes/_authenticated/admin/kungfus/-lib/kungfus-form-schema';
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

const emptyValues = {
  name: '',
  schoolId: '',
  kungfuType: 'attack' as const,
  attackType: '' as const,
  attackMethod: '' as const,
  formationName: '',
  formationEffects: emptyFormationEffects(),
  isPveExternalRecommended: false,
  isPveInternalRecommended: false,
  isUnlimited: false,
  icon: '',
  aliasText: '',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('KungfuFormComponent', () => {
  beforeEach(() => {
    listAllSchools.mockReset();
    listAllSchools.mockResolvedValue(schools);
  });

  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <KungfuFormComponent
          formId="kungfu-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="kungfu-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('alert')
        .some((el) => el.textContent === '请选择门派'),
    ).toBe(true);
  });

  it('submits values and can change type, attack, and flags', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <KungfuFormComponent
          formId="kungfu-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="kungfu-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '紫霞功');
    await chooseSelectOption(user, '门派', '纯阳');
    await user.click(screen.getByRole('button', { name: '治疗' }));
    await user.click(screen.getByRole('button', { name: '内功' }));
    await user.click(screen.getByRole('button', { name: '远程' }));
    await user.type(screen.getByLabelText('图标'), '/icon.png');
    await user.type(screen.getByLabelText('阵眼名称'), '紫霞');
    await user.type(screen.getByLabelText('第一重'), '提高内功攻击');
    await user.type(screen.getByLabelText('第二重'), '提高会心');
    await user.type(screen.getByLabelText('别名'), '气纯');
    await user.click(screen.getByRole('switch', { name: '无界' }));
    await user.click(screen.getByRole('switch', { name: 'PVE 外功推荐' }));
    await user.click(screen.getByRole('switch', { name: 'PVE 内功推荐' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'heal',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '紫霞',
      formationEffects: ['提高内功攻击', '提高会心', '', '', '', ''],
      isPveExternalRecommended: true,
      isPveInternalRecommended: true,
      isUnlimited: true,
      icon: '/icon.png',
      aliasText: '气纯',
    });
  });

  it('ignores an empty kungfu type toggle and can clear attack fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <KungfuFormComponent
          formId="kungfu-form"
          initialValues={{
            ...emptyValues,
            name: '紫霞功',
            schoolId: 'school-1',
            kungfuType: 'defense',
            attackType: 'external',
            attackMethod: 'melee',
          }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="kungfu-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '防御' }));
    await user.click(screen.getByRole('button', { name: '外功' }));
    await user.click(screen.getByRole('button', { name: '近战' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kungfuType: 'defense',
        attackType: '',
        attackMethod: '',
      }),
    );
  });

  it('shows length errors and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <KungfuFormComponent
          formId="kungfu-form"
          initialValues={{
            ...emptyValues,
            name: '紫霞功',
            schoolId: 'school-1',
            icon: 'x'.repeat(513),
            aliasText: 'x'.repeat(201),
            formationName: 'x'.repeat(65),
            formationEffects: ['x'.repeat(2001), '', '', '', '', ''],
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="kungfu-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('名称')).toBeDisabled();
    expect(screen.getByLabelText('第一重')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('图标地址最多 512 个字符')).toBeInTheDocument();
    expect(screen.getByText('别名最多 200 个字符')).toBeInTheDocument();
    expect(screen.getByText('阵眼名称最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('阵眼效果最多 2000 个字符')).toBeInTheDocument();
  });
});
