import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RaidMemberPanel from '@/routes/_authenticated/raid-run/-components/RaidMemberPanel';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import {
  createRaidSignup,
  setRaidSignupIsLeader,
} from '@/routes/_authenticated/raid-run/-lib/raid-signup';
import { renderWithQueryClient } from '../../../../helpers/render';

const { listAllKungfus, listAllGameServers, searchRaidSignups } = vi.hoisted(
  () => ({
    listAllKungfus: vi.fn(),
    listAllGameServers: vi.fn(),
    searchRaidSignups: vi.fn(),
  }),
);

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

vi.mock('@/lib/api/raid-signups-api', () => ({
  raidSignupsSearchQueryKey: (name: string) => ['raid-signups-search', name],
  searchRaidSignups,
}));

const kungfus = [
  {
    id: 'kungfu-1',
    name: '紫霞功',
    schoolId: 'school-1',
    schoolName: '纯阳',
    kungfuType: 'attack' as const,
    icon: '/icons/zixia.png',
    alias: [],
  },
  {
    id: 'kungfu-2',
    name: '铁牢律',
    schoolId: 'school-2',
    schoolName: '天策',
    kungfuType: 'defense' as const,
    icon: null,
    alias: [],
  },
];

const servers = [
  {
    id: 'server-1',
    zone: '电信一区',
    name: '梦江南',
    alias: [],
  },
];

describe('RaidMemberPanel', () => {
  beforeEach(() => {
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    searchRaidSignups.mockReset();
    listAllKungfus.mockResolvedValue(kungfus);
    listAllGameServers.mockResolvedValue(servers);
    searchRaidSignups.mockResolvedValue([]);
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1' }),
      selectedSlot: null,
    });
  });

  it('prompts to select a slot when none is selected', () => {
    renderWithQueryClient(<RaidMemberPanel />);
    expect(screen.getByText('团员属性')).toBeInTheDocument();
    expect(screen.getByText('尚未选择位置')).toBeInTheDocument();
    expect(
      screen.getByText('请在团队布局中点击一个位置，即可编辑该团员属性。'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '清空' }),
    ).not.toBeInTheDocument();
  });

  it('edits the selected signup fields', async () => {
    const user = userEvent.setup();
    useRaidRun.setState({
      selectedSlot: { groupNumber: 2, positionNumber: 3 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    expect(screen.getByText('第2队第3位')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('角色名');
    await user.click(nameInput);
    await user.type(nameInput, '少侠甲');
    await user.type(screen.getByLabelText('备注'), '需要奶量');

    expect(useRaidRun.getState().raidRun.signups[1][2].characterName).toBe(
      '少侠甲',
    );
    expect(useRaidRun.getState().raidRun.signups[1][2].remark).toBe('需要奶量');

    await user.click(screen.getByLabelText('职能'));
    await user.click(await screen.findByRole('option', { name: '坦克' }));
    expect(useRaidRun.getState().raidRun.signups[1][2].role).toBe('tank');
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(1);

    const kungfu = await waitFor(() => screen.getByLabelText('心法'));
    await user.click(kungfu);
    await user.click(await screen.findByRole('option', { name: /紫霞功/ }));
    expect(useRaidRun.getState().raidRun.signups[1][2]).toMatchObject({
      kungfuId: 'kungfu-1',
      schoolId: 'school-1',
      role: 'dps',
    });
    expect(useRaidRun.getState().raidRun.reservedDps).toBe(1);
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(0);

    const server = screen.getByLabelText('服务器');
    await user.click(server);
    await user.click(
      await screen.findByRole('option', { name: '电信一区 · 梦江南' }),
    );
    expect(useRaidRun.getState().raidRun.signups[1][2].serverId).toBe(
      'server-1',
    );
  });

  it('fills name, server, kungfu, and role from a search suggestion', async () => {
    const user = userEvent.setup();
    searchRaidSignups.mockResolvedValue([
      {
        id: 'signup-hist-1',
        characterName: '少侠甲',
        serverId: 'server-1',
        serverName: '梦江南',
        kungfuId: 'kungfu-2',
        kungfuName: '铁牢律',
        schoolId: 'school-2',
        kungfuType: 'defense' as const,
      },
    ]);
    useRaidRun.setState({
      selectedSlot: { groupNumber: 2, positionNumber: 3 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    const nameInput = screen.getByLabelText('角色名');
    await user.click(nameInput);
    await user.type(nameInput, '少侠');
    await user.click(
      await screen.findByRole('option', {
        name: '少侠甲 · 梦江南 · 铁牢律',
      }),
    );

    expect(useRaidRun.getState().raidRun.signups[1][2]).toMatchObject({
      characterName: '少侠甲',
      serverId: 'server-1',
      kungfuId: 'kungfu-2',
      schoolId: 'school-2',
      role: 'tank',
    });
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(1);
  });

  it('updates role from the selected kungfu type', async () => {
    const user = userEvent.setup();
    useRaidRun.setState({
      selectedSlot: { groupNumber: 1, positionNumber: 1 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    const kungfu = await waitFor(() => screen.getByLabelText('心法'));
    await user.click(kungfu);
    await user.click(await screen.findByRole('option', { name: /铁牢律/ }));
    expect(useRaidRun.getState().raidRun.signups[0][0].role).toBe('tank');
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(1);
  });

  it('keeps leader exclusive across the raid', async () => {
    const user = userEvent.setup();
    const run = createRaidRun({ id: 'run-1' });
    run.signups[0][0] = setRaidSignupIsLeader(run.signups[0][0], true);
    useRaidRun.setState({
      raidRun: run,
      selectedSlot: { groupNumber: 2, positionNumber: 1 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    await user.click(screen.getByRole('checkbox', { name: '是否团长' }));
    expect(useRaidRun.getState().raidRun.signups[1][0].isLeader).toBe(true);
    expect(useRaidRun.getState().raidRun.signups[0][0].isLeader).toBe(false);

    await user.click(screen.getByRole('checkbox', { name: '是否黑本' }));
    await user.click(screen.getByRole('checkbox', { name: '是否阵眼' }));
    expect(useRaidRun.getState().raidRun.signups[1][0].isDarkRun).toBe(true);
    expect(useRaidRun.getState().raidRun.signups[1][0].isFormationCore).toBe(
      true,
    );

    await user.click(screen.getByRole('checkbox', { name: '是否团长' }));
    expect(useRaidRun.getState().raidRun.signups[1][0].isLeader).toBe(false);
  });

  it('clears mutable fields and keeps the slot identity', async () => {
    const user = userEvent.setup();
    const run = createRaidRun({ id: 'run-1' });
    const slot = run.signups[1][2];
    run.signups[1][2] = createRaidSignup({
      id: slot.id,
      groupNumber: 2,
      positionNumber: 3,
      role: 'tank',
      isLeader: true,
      isDarkRun: true,
      isFormationCore: true,
      serverId: 'server-1',
      characterName: '少侠甲',
      schoolId: 'school-2',
      kungfuId: 'kungfu-2',
      remark: '需要奶量',
    });
    run.reservedTank = 1;
    useRaidRun.setState({
      raidRun: run,
      selectedSlot: { groupNumber: 2, positionNumber: 3 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    await user.click(screen.getByRole('button', { name: '清空' }));

    expect(useRaidRun.getState().raidRun.signups[1][2]).toEqual({
      id: slot.id,
      groupNumber: 2,
      positionNumber: 3,
      role: 'pending',
      isLeader: false,
      isDarkRun: false,
      isFormationCore: false,
      serverId: undefined,
      characterName: undefined,
      schoolId: undefined,
      kungfuId: undefined,
      remark: undefined,
    });
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(0);
  });

  it('prompts to select a slot when the selected slot is missing', () => {
    useRaidRun.setState({
      selectedSlot: { groupNumber: 9, positionNumber: 1 },
    });
    renderWithQueryClient(<RaidMemberPanel />);
    expect(screen.getByText('团员属性')).toBeInTheDocument();
    expect(screen.getByText('尚未选择位置')).toBeInTheDocument();
    expect(screen.queryByLabelText('职能')).not.toBeInTheDocument();
  });
});
