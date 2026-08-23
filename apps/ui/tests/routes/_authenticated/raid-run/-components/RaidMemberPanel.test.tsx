import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RaidMemberPanel from '@/routes/_authenticated/raid-run/-components/RaidMemberPanel';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { setRaidSignupIsLeader } from '@/routes/_authenticated/raid-run/-lib/raid-signup';
import { renderWithQueryClient } from '../../../../helpers/render';

const { listAllKungfus, listAllGameServers } = vi.hoisted(() => ({
  listAllKungfus: vi.fn(),
  listAllGameServers: vi.fn(),
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
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
    listAllKungfus.mockResolvedValue(kungfus);
    listAllGameServers.mockResolvedValue(servers);
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1' }),
      selectedSlot: null,
    });
  });

  it('renders nothing until a slot is selected', () => {
    renderWithQueryClient(<RaidMemberPanel />);
    expect(screen.queryByText('团员属性')).not.toBeInTheDocument();
  });

  it('edits the selected signup fields', async () => {
    const user = userEvent.setup();
    useRaidRun.setState({
      selectedSlot: { groupNumber: 2, positionNumber: 3 },
    });
    renderWithQueryClient(<RaidMemberPanel />);

    expect(screen.getByText('第2队第3位')).toBeInTheDocument();

    await user.type(screen.getByLabelText('角色名'), '少侠甲');
    await user.type(screen.getByLabelText('备注'), '需要奶量');

    expect(useRaidRun.getState().raidRun.signups[1][2].characterName).toBe(
      '少侠甲',
    );
    expect(useRaidRun.getState().raidRun.signups[1][2].remark).toBe('需要奶量');

    await user.click(screen.getByLabelText('职能'));
    await user.click(await screen.findByRole('option', { name: '坦克' }));
    expect(useRaidRun.getState().raidRun.signups[1][2].role).toBe('tank');

    const kungfu = await waitFor(() => screen.getByLabelText('心法'));
    await user.click(kungfu);
    await user.click(await screen.findByRole('option', { name: /紫霞功/ }));
    expect(useRaidRun.getState().raidRun.signups[1][2]).toMatchObject({
      kungfuId: 'kungfu-1',
      schoolId: 'school-1',
      role: 'dps',
    });

    const server = screen.getByLabelText('服务器');
    await user.click(server);
    await user.click(
      await screen.findByRole('option', { name: '电信一区 · 梦江南' }),
    );
    expect(useRaidRun.getState().raidRun.signups[1][2].serverId).toBe(
      'server-1',
    );
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

  it('renders nothing when the selected slot is missing', () => {
    useRaidRun.setState({
      selectedSlot: { groupNumber: 9, positionNumber: 1 },
    });
    renderWithQueryClient(<RaidMemberPanel />);
    expect(screen.queryByText('团员属性')).not.toBeInTheDocument();
  });
});
