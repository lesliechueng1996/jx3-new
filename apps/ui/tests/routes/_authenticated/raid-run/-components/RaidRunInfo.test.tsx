import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RaidRunInfo from '@/routes/_authenticated/raid-run/-components/RaidRunInfo';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { renderWithQueryClient } from '../../../../helpers/render';

const { searchGameDungeons } = vi.hoisted(() => ({
  searchGameDungeons: vi.fn(),
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

const dungeonItem = {
  id: 'dungeon-1',
  name: '25人英雄',
  expansionId: 'exp-1',
  expansionName: '资料片',
  seasonId: 'season-1',
  seasonName: '赛季',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
};

describe('RaidRunInfo', () => {
  beforeEach(() => {
    searchGameDungeons.mockReset();
    searchGameDungeons.mockResolvedValue([dungeonItem]);
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1', name: '' }),
      selectedSlot: null,
    });
  });

  it('updates raid run fields from the form', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RaidRunInfo />);

    expect(screen.getByText('开团信息')).toBeInTheDocument();

    await user.type(screen.getByLabelText('团队名称'), '周六英雄团');
    await user.type(screen.getByLabelText('描述'), '开团说明');
    fireEvent.change(screen.getByLabelText('坦克预留'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('治疗预留'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText('DPS 预留'), {
      target: { value: '18' },
    });
    fireEvent.change(screen.getByLabelText('老板预留'), {
      target: { value: '2' },
    });
    await user.type(screen.getByLabelText('备注'), '其他补充');

    const dungeon = screen.getByLabelText('副本');
    await user.type(dungeon, '英雄');
    await user.click(
      await screen.findByRole(
        'option',
        { name: '25人英雄（英雄 · 25人）' },
        { timeout: 2000 },
      ),
    );

    fireEvent.change(screen.getByLabelText('集合时间'), {
      target: { value: '2026-08-23T20:00' },
    });
    fireEvent.change(screen.getByLabelText('进本时间'), {
      target: { value: '2026-08-23T20:30' },
    });
    fireEvent.change(screen.getByLabelText('预计结束时间'), {
      target: { value: '2026-08-23T22:00' },
    });

    const { raidRun } = useRaidRun.getState();
    expect(raidRun.name).toBe('周六英雄团');
    expect(raidRun.description).toBe('开团说明');
    expect(raidRun.reservedTank).toBe(2);
    expect(raidRun.reservedHealer).toBe(3);
    expect(raidRun.reservedDps).toBe(18);
    expect(raidRun.reservedBoss).toBe(2);
    expect(raidRun.remark).toBe('其他补充');
    expect(raidRun.dungeon).toEqual({
      id: 'dungeon-1',
      name: '25人英雄',
      playerLimit: 25,
      bossCount: 6,
      difficulty: 'heroic',
    });
    expect(raidRun.gatherTime.getHours()).toBe(20);
  });

  it('ignores invalid reserved counts and empty times', () => {
    renderWithQueryClient(<RaidRunInfo />);

    fireEvent.change(screen.getByLabelText('坦克预留'), {
      target: { value: '-1' },
    });
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(0);

    fireEvent.change(screen.getByLabelText('坦克预留'), {
      target: { value: '' },
    });
    expect(useRaidRun.getState().raidRun.reservedTank).toBe(0);

    fireEvent.change(screen.getByLabelText('集合时间'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('集合时间'), {
      target: { value: 'not-a-date' },
    });
    expect(useRaidRun.getState().raidRun.gatherTime).toBeInstanceOf(Date);
  });
});
