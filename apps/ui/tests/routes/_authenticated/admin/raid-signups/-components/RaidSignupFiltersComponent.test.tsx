import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaidSignupFiltersComponent } from '@/routes/_authenticated/admin/raid-signups/-components/RaidSignupFiltersComponent';
import type { RaidSignupsSearch } from '@/routes/_authenticated/admin/raid-signups/-lib/raid-signups-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { listAllGameServers, listAllKungfus } = vi.hoisted(() => ({
  listAllGameServers: vi.fn(),
  listAllKungfus: vi.fn(),
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

const servers = [
  {
    id: 'server-1',
    zone: '电信',
    name: '梦江南',
    alias: ['双梦'],
  },
];

const kungfus = [
  {
    id: 'kungfu-1',
    name: '紫霞功',
    schoolId: 'school-1',
    schoolName: '纯阳',
    kungfuType: 'attack' as const,
    icon: null,
    alias: ['气纯'],
  },
];

const filters: RaidSignupsSearch = {
  page: 3,
  pageSize: 20,
  characterName: '旧',
  raidRunName: '旧团',
  serverId: 'server-1',
  kungfuId: 'kungfu-1',
  role: 'dps',
  flags: ['leader'],
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('RaidSignupFiltersComponent', () => {
  beforeEach(() => {
    listAllGameServers.mockReset();
    listAllKungfus.mockReset();
    listAllGameServers.mockResolvedValue(servers);
    listAllKungfus.mockResolvedValue(kungfus);
  });

  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
      <RaidSignupFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const characterInput = screen.getByLabelText('角色名');
    await user.clear(characterInput);
    await user.type(characterInput, '少侠甲');
    const raidRunInput = screen.getByLabelText('团队名称');
    await user.clear(raidRunInput);
    await user.type(raidRunInput, '周六团');
    await chooseSelectOption(user, '区服', '电信 · 梦江南');
    await chooseSelectOption(user, '心法', '紫霞功');
    await chooseSelectOption(user, '职能', '坦克');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      characterName: '少侠甲',
      raidRunName: '周六团',
      serverId: 'server-1',
      kungfuId: 'kungfu-1',
      role: 'tank',
      flags: ['leader'],
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear role and flags', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <RaidSignupFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '职能', '全部');
    await user.click(screen.getByRole('button', { name: '团长' }));
    await user.type(screen.getByLabelText('角色名'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        role: undefined,
        flags: undefined,
      }),
    );
  });

  it('can select every role and multiple flags', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <RaidSignupFiltersComponent
        committedFilters={{ ...filters, role: undefined, flags: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    const roles = [
      ['待定', 'pending'],
      ['治疗', 'healer'],
      ['输出', 'dps'],
      ['老板', 'boss'],
    ] as const;

    for (const [label, role] of roles) {
      await chooseSelectOption(user, '职能', label);
      await user.click(screen.getByRole('button', { name: '搜索' }));
      expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ role }));
    }

    await user.click(screen.getByRole('button', { name: '团长' }));
    await user.click(screen.getByRole('button', { name: '黑本' }));
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ flags: ['leader', 'darkRun'] }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = renderWithQueryClient(
      <RaidSignupFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <RaidSignupFiltersComponent
        committedFilters={{ ...filters, characterName: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('角色名')).toHaveValue('新');
  });
});
