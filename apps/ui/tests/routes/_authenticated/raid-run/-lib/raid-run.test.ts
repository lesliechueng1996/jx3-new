import { describe, expect, it } from 'vitest';
import {
  createRaidRun,
  formatRaidDungeonLabel,
  RAID_RUN_POSITION_COUNT_PER_GROUP,
  RAID_RUN_TOTAL_GROUP_COUNT,
  raidRunStatusMapping,
  setRaidRunDescription,
  setRaidRunDungeon,
  setRaidRunDungeonInput,
  setRaidRunEndTime,
  setRaidRunGameRaidId,
  setRaidRunGatherTime,
  setRaidRunName,
  setRaidRunRemark,
  setRaidRunReservedBoss,
  setRaidRunReservedDps,
  setRaidRunReservedHealer,
  setRaidRunReservedTank,
  setRaidRunStartTime,
  setRaidRunStatus,
  setRaidRunSubsidyAmount,
  setRaidRunTotalIncome,
  setRaidRunWagePerPerson,
  updateRaidSignupAt,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { setRaidSignupRole } from '@/routes/_authenticated/raid-run/-lib/raid-signup';

const dungeon = {
  id: 'dungeon-1',
  name: '25人英雄',
  playerLimit: 25,
  bossCount: 6,
  difficulty: 'heroic' as const,
};

describe('raid-run', () => {
  it('maps statuses to Chinese labels', () => {
    expect(raidRunStatusMapping.pending).toBe('待开始');
    expect(raidRunStatusMapping.cancelled).toBe('已取消');
  });

  it('creates an empty 5x5 signup grid with defaults', () => {
    const run = createRaidRun();

    expect(run.id).toEqual(expect.any(String));
    expect(run.status).toBe('pending');
    expect(run.reservedTank).toBe(0);
    expect(run.reservedHealer).toBe(0);
    expect(run.reservedDps).toBe(0);
    expect(run.reservedBoss).toBe(0);
    expect(run.totalIncome).toBe(0);
    expect(run.wagePerPerson).toBe(0);
    expect(run.subsidyAmount).toBe(0);
    expect(run.gatherTime).toBeInstanceOf(Date);
    expect(run.startTime).toBeInstanceOf(Date);
    expect(run.endTime).toBeInstanceOf(Date);
    expect(run.totalGroupCount).toBe(RAID_RUN_TOTAL_GROUP_COUNT);
    expect(run.positionCountPerGroup).toBe(RAID_RUN_POSITION_COUNT_PER_GROUP);
    expect(run.signups).toHaveLength(5);
    expect(run.signups[0]).toHaveLength(5);
    expect(run.signups[4][4]).toMatchObject({
      groupNumber: 5,
      positionNumber: 5,
      role: 'pending',
    });
  });

  it('creates a raid run from provided props', () => {
    const gatherTime = new Date('2026-08-23T12:00:00.000Z');
    const startTime = new Date('2026-08-23T13:00:00.000Z');
    const endTime = new Date('2026-08-23T15:00:00.000Z');
    const run = createRaidRun({
      id: 'run-1',
      name: '周六开团',
      description: '描述',
      status: 'recruiting',
      gatherTime,
      startTime,
      endTime,
      reservedTank: 2,
      reservedHealer: 3,
      reservedDps: 18,
      reservedBoss: 2,
      remark: '备注',
      totalIncome: 100,
      wagePerPerson: 4,
      subsidyAmount: 10,
      gameRaidId: 'game-1',
      dungeonInput: '25人英雄',
      dungeon,
    });

    expect(run).toMatchObject({
      id: 'run-1',
      name: '周六开团',
      description: '描述',
      status: 'recruiting',
      reservedTank: 2,
      dungeonInput: '25人英雄',
      dungeon,
    });
    expect(run.gatherTime).toBe(gatherTime);
  });

  it('returns new snapshots from field setters without mutating the original', () => {
    const run = createRaidRun({ id: 'run-1', name: '旧名' });
    const gatherTime = new Date('2026-08-24T12:00:00.000Z');
    const startTime = new Date('2026-08-24T13:00:00.000Z');
    const endTime = new Date('2026-08-24T15:00:00.000Z');

    expect(setRaidRunName(run, '新名').name).toBe('新名');
    expect(setRaidRunDescription(run, '新描述').description).toBe('新描述');
    expect(setRaidRunStatus(run, 'ongoing').status).toBe('ongoing');
    expect(setRaidRunDungeonInput(run, '输入').dungeonInput).toBe('输入');
    expect(formatRaidDungeonLabel(dungeon)).toBe('25人英雄（英雄 · 25人）');
    expect(setRaidRunDungeon(run, dungeon).dungeon).toEqual(dungeon);
    expect(setRaidRunReservedTank(run, 1).reservedTank).toBe(1);
    expect(setRaidRunReservedHealer(run, 2).reservedHealer).toBe(2);
    expect(setRaidRunReservedDps(run, 3).reservedDps).toBe(3);
    expect(setRaidRunReservedBoss(run, 4).reservedBoss).toBe(4);
    expect(setRaidRunRemark(run, '新备注').remark).toBe('新备注');
    expect(setRaidRunTotalIncome(run, 50).totalIncome).toBe(50);
    expect(setRaidRunWagePerPerson(run, 2).wagePerPerson).toBe(2);
    expect(setRaidRunSubsidyAmount(run, 8).subsidyAmount).toBe(8);
    expect(setRaidRunGameRaidId(run, 'game-2').gameRaidId).toBe('game-2');
    expect(setRaidRunGatherTime(run, gatherTime).gatherTime).toBe(gatherTime);
    expect(setRaidRunStartTime(run, startTime).startTime).toBe(startTime);
    expect(setRaidRunEndTime(run, endTime).endTime).toBe(endTime);
    expect(run.name).toBe('旧名');
  });

  it('updates one signup slot and leaves the rest unchanged', () => {
    const run = createRaidRun({ id: 'run-1' });
    const originalSlot = run.signups[0][0];
    const next = updateRaidSignupAt(run, 1, 1, (signup) =>
      setRaidSignupRole(signup, 'dps'),
    );

    expect(next.signups[0][0].role).toBe('dps');
    expect(next.signups[0][1]).toBe(run.signups[0][1]);
    expect(next.signups[1]).toBe(run.signups[1]);
    expect(originalSlot.role).toBe('pending');
    expect(
      updateRaidSignupAt(run, 9, 9, (signup) =>
        setRaidSignupRole(signup, 'boss'),
      ).signups,
    ).toEqual(run.signups);
  });
});
