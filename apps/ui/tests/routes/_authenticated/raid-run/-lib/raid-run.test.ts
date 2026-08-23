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

const tenPlayerDungeon = {
  id: 'dungeon-2',
  name: '10人普通',
  playerLimit: 10,
  bossCount: 3,
  difficulty: 'normal' as const,
};

const thirtyFivePlayerDungeon = {
  id: 'dungeon-3',
  name: '35人挑战',
  playerLimit: 35,
  bossCount: 8,
  difficulty: 'challenge' as const,
};

const onePlayerDungeon = {
  id: 'dungeon-5',
  name: '单人',
  playerLimit: 1,
  bossCount: 1,
  difficulty: 'normal' as const,
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
    expect(run.totalGroupCount).toBe(5);
    expect(run.signups).toHaveLength(5);
  });

  it('sizes the signup grid from the dungeon player limit on create', () => {
    const run = createRaidRun({ dungeon: tenPlayerDungeon });

    expect(run.totalGroupCount).toBe(2);
    expect(run.signups).toHaveLength(2);
    expect(run.signups[1][4]).toMatchObject({
      groupNumber: 2,
      positionNumber: 5,
      role: 'pending',
    });
  });

  it('clamps the signup grid to at least one group', () => {
    const run = createRaidRun({ dungeon: onePlayerDungeon });
    const emptyLimit = createRaidRun({
      dungeon: { ...onePlayerDungeon, playerLimit: 0 },
    });

    expect(run.totalGroupCount).toBe(1);
    expect(run.signups).toHaveLength(1);
    expect(run.signups[0][0].groupNumber).toBe(1);
    expect(emptyLimit.totalGroupCount).toBe(1);
    expect(emptyLimit.signups).toHaveLength(1);
  });

  it('allows more than five groups when the dungeon needs them', () => {
    const run = createRaidRun({ dungeon: thirtyFivePlayerDungeon });

    expect(run.totalGroupCount).toBe(7);
    expect(run.signups).toHaveLength(7);
    expect(run.signups[6][4].groupNumber).toBe(7);
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
    expect(formatRaidDungeonLabel(tenPlayerDungeon)).toBe(
      '10人普通（普通 · 10人）',
    );
    expect(formatRaidDungeonLabel(thirtyFivePlayerDungeon)).toBe(
      '35人挑战（挑战 · 35人）',
    );
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

  it('shrinks the signup grid when the dungeon needs fewer groups', () => {
    const run = updateRaidSignupAt(createRaidRun({ dungeon }), 1, 1, (signup) =>
      setRaidSignupRole(signup, 'tank'),
    );
    const next = setRaidRunDungeon(run, tenPlayerDungeon);

    expect(next.dungeon).toEqual(tenPlayerDungeon);
    expect(next.totalGroupCount).toBe(2);
    expect(next.signups).toHaveLength(2);
    expect(next.signups[0][0].role).toBe('tank');
    expect(next.signups[1][0].groupNumber).toBe(2);
    expect(run.signups).toHaveLength(5);
  });

  it('expands the signup grid with continuing group numbers', () => {
    const run = createRaidRun({ dungeon: tenPlayerDungeon });
    const next = setRaidRunDungeon(run, thirtyFivePlayerDungeon);

    expect(next.totalGroupCount).toBe(7);
    expect(next.signups).toHaveLength(7);
    expect(next.signups[0]).toBe(run.signups[0]);
    expect(next.signups[2][0]).toMatchObject({
      groupNumber: 3,
      positionNumber: 1,
      role: 'pending',
    });
    expect(next.signups[6][4]).toMatchObject({
      groupNumber: 7,
      positionNumber: 5,
      role: 'pending',
    });
  });

  it('keeps the signup grid when the dungeon uses the same group count', () => {
    const run = createRaidRun({ dungeon });
    const next = setRaidRunDungeon(run, {
      ...dungeon,
      id: 'dungeon-4',
      name: '另一场25人',
    });

    expect(next.dungeon?.id).toBe('dungeon-4');
    expect(next.totalGroupCount).toBe(5);
    expect(next.signups).toBe(run.signups);
  });

  it('can shrink and then expand again from the updated group count', () => {
    const shrunk = setRaidRunDungeon(
      createRaidRun({ dungeon }),
      tenPlayerDungeon,
    );
    const expanded = setRaidRunDungeon(shrunk, dungeon);

    expect(shrunk.totalGroupCount).toBe(2);
    expect(expanded.totalGroupCount).toBe(5);
    expect(expanded.signups).toHaveLength(5);
    expect(expanded.signups[4][0].groupNumber).toBe(5);
  });
});
