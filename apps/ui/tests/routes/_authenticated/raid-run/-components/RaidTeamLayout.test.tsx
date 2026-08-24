import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RaidTeamLayout from '@/routes/_authenticated/raid-run/-components/RaidTeamLayout';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import {
  createRaidSignup,
  setRaidSignupCharacterName,
  setRaidSignupIsDarkRun,
  setRaidSignupIsFormationCore,
  setRaidSignupIsLeader,
  setRaidSignupKungfu,
  setRaidSignupRole,
  setRaidSignupServerId,
} from '@/routes/_authenticated/raid-run/-lib/raid-signup';
import { renderWithQueryClient } from '../../../../helpers/render';

const { listAllKungfus, listAllGameServers, dndKit } = vi.hoisted(() => ({
  listAllKungfus: vi.fn(),
  listAllGameServers: vi.fn(),
  dndKit: {
    onDragEnd: undefined as
      | ((event: {
          canceled: boolean;
          operation: {
            source?: { id: string | number };
            target?: { id: string | number };
          };
        }) => void)
      | undefined,
    isDragging: false,
    isDropTarget: false,
  },
}));

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd?: (typeof dndKit)['onDragEnd'];
  }) => {
    dndKit.onDragEnd = onDragEnd;
    return children;
  },
  useDraggable: () => ({
    ref: vi.fn(),
    isDragging: dndKit.isDragging,
  }),
  useDroppable: () => ({
    ref: vi.fn(),
    isDropTarget: dndKit.isDropTarget,
  }),
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

const filledSignup = setRaidSignupIsDarkRun(
  setRaidSignupIsFormationCore(
    setRaidSignupIsLeader(
      setRaidSignupServerId(
        setRaidSignupKungfu(
          setRaidSignupCharacterName(
            setRaidSignupRole(
              createRaidSignup({
                id: 'signup-1',
                groupNumber: 1,
                positionNumber: 1,
              }),
              'tank',
            ),
            '少侠甲',
          ),
          { id: 'kungfu-1', schoolId: 'school-1', kungfuType: 'defense' },
        ),
        'server-1',
      ),
      true,
    ),
    true,
  ),
  true,
);

describe('RaidTeamLayout', () => {
  beforeEach(() => {
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    listAllKungfus.mockResolvedValue([
      {
        id: 'kungfu-1',
        name: '铁牢律',
        schoolId: 'school-1',
        schoolName: '天策',
        kungfuType: 'defense',
        icon: '/icons/tielao.png',
        alias: [],
      },
    ]);
    listAllGameServers.mockResolvedValue([
      {
        id: 'server-1',
        zone: '电信一区',
        name: '梦江南',
        alias: [],
      },
    ]);
    dndKit.onDragEnd = undefined;
    dndKit.isDragging = false;
    dndKit.isDropTarget = false;
    const run = createRaidRun({ id: 'run-1' });
    run.signups[0][0] = filledSignup;
    useRaidRun.setState({
      raidRun: run,
      selectedSlot: null,
    });
  });

  it('shows empty slots and filled member details', async () => {
    renderWithQueryClient(<RaidTeamLayout />);

    expect(screen.getByText('团队布局')).toBeInTheDocument();
    expect(screen.getByText('1队')).toBeInTheDocument();
    expect(screen.getByText('5队')).toBeInTheDocument();
    expect(screen.getAllByText('空位').length).toBeGreaterThan(0);
    expect(await screen.findByText('少侠甲')).toBeInTheDocument();
    expect(await screen.findByText('梦江南')).toBeInTheDocument();
    expect(await screen.findByAltText('铁牢律图标')).toBeInTheDocument();
    expect(screen.getByLabelText('团长')).toBeInTheDocument();
    expect(screen.getByLabelText('阵眼')).toBeInTheDocument();
    expect(screen.getByLabelText('黑本')).toBeInTheDocument();
  });

  it('selects a slot when a cell is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RaidTeamLayout />);

    await user.click(screen.getByRole('button', { name: '第2队第3位' }));
    expect(useRaidRun.getState().selectedSlot).toEqual({
      groupNumber: 2,
      positionNumber: 3,
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '第2队第3位' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('shows a placeholder name when the slot has a role but no character', () => {
    const run = createRaidRun({ id: 'run-2' });
    run.signups[0][1] = setRaidSignupRole(run.signups[0][1], 'healer');
    useRaidRun.setState({ raidRun: run, selectedSlot: null });

    renderWithQueryClient(<RaidTeamLayout />);
    expect(
      screen.getByRole('button', { name: '第1队第2位' }),
    ).toHaveTextContent('空位');
  });

  it('swaps signup attributes when a slot is dropped onto another', () => {
    const run = useRaidRun.getState().raidRun;
    run.signups[1][2] = setRaidSignupCharacterName(
      setRaidSignupRole(run.signups[1][2], 'healer'),
      '少侠乙',
    );
    useRaidRun.setState({ raidRun: run, selectedSlot: null });
    const targetId = run.signups[1][2].id;
    renderWithQueryClient(<RaidTeamLayout />);

    dndKit.onDragEnd?.({
      canceled: false,
      operation: {
        source: { id: '1:1' },
        target: { id: '2:3' },
      },
    });

    const next = useRaidRun.getState().raidRun;
    expect(next.signups[0][0]).toMatchObject({
      id: targetId,
      groupNumber: 1,
      positionNumber: 1,
      characterName: '少侠乙',
      role: 'healer',
    });
    expect(next.signups[1][2]).toMatchObject({
      id: filledSignup.id,
      groupNumber: 2,
      positionNumber: 3,
      characterName: '少侠甲',
      role: 'tank',
      isLeader: true,
    });
  });

  it('does not swap when the drag is canceled or the drop target is invalid', () => {
    renderWithQueryClient(<RaidTeamLayout />);
    const before = useRaidRun.getState().raidRun;

    dndKit.onDragEnd?.({
      canceled: true,
      operation: {
        source: { id: '1:1' },
        target: { id: '2:3' },
      },
    });
    dndKit.onDragEnd?.({
      canceled: false,
      operation: {
        source: { id: '1:1' },
        target: { id: '1:1' },
      },
    });
    dndKit.onDragEnd?.({
      canceled: false,
      operation: {},
    });

    expect(useRaidRun.getState().raidRun).toBe(before);
  });

  it('renders drag and drop visual states', () => {
    dndKit.isDragging = true;
    dndKit.isDropTarget = true;
    renderWithQueryClient(<RaidTeamLayout />);

    expect(screen.getByRole('button', { name: '第1队第1位' })).toHaveAttribute(
      'aria-grabbed',
      'true',
    );
  });
});
