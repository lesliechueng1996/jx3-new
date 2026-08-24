import { describe, expect, it } from 'vitest';
import {
  applyRaidRunReservedToSignups,
  calculateRaidRunWagePerPerson,
  clampRaidRunReservedToLimit,
  countRaidRunWageShareSignups,
  createRaidRun,
  formatRaidDungeonLabel,
  getRaidSignupAt,
  parseRaidRunReservedCount,
  RAID_RUN_DEFAULT_PLAYER_LIMIT,
  RAID_RUN_POSITION_COUNT_PER_GROUP,
  RAID_RUN_TOTAL_GROUP_COUNT,
  raidRunReservedLimit,
  raidRunReservedTotal,
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
  setRaidRunWages,
  setRaidSignupDarkRunExclusive,
  setRaidSignupFormationCoreExclusive,
  setRaidSignupLeaderExclusive,
  swapRaidSignupsAt,
  syncRaidRunReservedFromSignups,
  updateRaidSignupAt,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import {
  setRaidSignupCharacterName,
  setRaidSignupRole,
} from '@/routes/_authenticated/raid-run/-lib/raid-signup';

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

const slotRoles = (run: ReturnType<typeof createRaidRun>) =>
  run.signups.map((group) => group.map((signup) => signup.role));

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
    expect(slotRoles(run)[0]).toEqual(['dps', 'dps', 'dps', 'dps', 'dps']);
    expect(slotRoles(run)[3]).toEqual([
      'dps',
      'dps',
      'dps',
      'healer',
      'healer',
    ]);
    expect(slotRoles(run)[4]).toEqual([
      'healer',
      'tank',
      'tank',
      'boss',
      'boss',
    ]);
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
    expect(
      setRaidRunWages(run, {
        totalIncome: 15000,
        subsidyAmount: 2000,
        wagePerPerson: 1300,
      }),
    ).toMatchObject({
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    });
    expect(setRaidRunGameRaidId(run, 'game-2').gameRaidId).toBe('game-2');
    expect(setRaidRunGatherTime(run, gatherTime).gatherTime).toBe(gatherTime);
    expect(setRaidRunStartTime(run, startTime).startTime).toBe(startTime);
    expect(setRaidRunEndTime(run, endTime).endTime).toBe(endTime);
    expect(run.name).toBe('旧名');
  });

  it('parses reserved count text without keeping leading zeros', () => {
    expect(parseRaidRunReservedCount('')).toBe(0);
    expect(parseRaidRunReservedCount('02')).toBe(2);
    expect(parseRaidRunReservedCount('67')).toBe(67);
    expect(parseRaidRunReservedCount('-1')).toBeUndefined();
    expect(parseRaidRunReservedCount('1.5')).toBeUndefined();
    expect(parseRaidRunReservedCount('abc')).toBeUndefined();
  });

  it('caps reserved counts to the dungeon player limit', () => {
    const run = createRaidRun({ id: 'run-1' });

    expect(raidRunReservedLimit(run)).toBe(RAID_RUN_DEFAULT_PLAYER_LIMIT);
    expect(setRaidRunReservedDps(run, 67).reservedDps).toBe(25);
    expect(setRaidRunReservedDps(run, Number.NaN)).toBe(run);
    expect(setRaidRunReservedDps(run, -1)).toBe(run);

    const withOthers = setRaidRunReservedHealer(
      setRaidRunReservedTank(run, 10),
      10,
    );
    expect(setRaidRunReservedDps(withOthers, 10).reservedDps).toBe(5);
    expect(raidRunReservedTotal(setRaidRunReservedDps(withOthers, 10))).toBe(
      25,
    );
    expect(setRaidRunReservedTank(run, 67).reservedTank).toBe(25);
    expect(setRaidRunReservedHealer(run, 67).reservedHealer).toBe(25);
    expect(setRaidRunReservedBoss(run, 67).reservedBoss).toBe(25);
    expect(setRaidRunReservedDps(run, 25.8).reservedDps).toBe(25);

    const tenPlayer = createRaidRun({
      id: 'run-2',
      dungeon: tenPlayerDungeon,
    });
    expect(raidRunReservedLimit(tenPlayer)).toBe(10);
    expect(setRaidRunReservedDps(tenPlayer, 67).reservedDps).toBe(10);
  });

  it('clamps reserved counts when a smaller dungeon is selected', () => {
    const filled = setRaidRunReservedBoss(
      setRaidRunReservedTank(
        setRaidRunReservedHealer(
          setRaidRunReservedDps(createRaidRun({ id: 'run-1' }), 18),
          3,
        ),
        2,
      ),
      2,
    );
    const next = setRaidRunDungeon(filled, tenPlayerDungeon);

    expect(next).toMatchObject({
      reservedDps: 10,
      reservedHealer: 0,
      reservedTank: 0,
      reservedBoss: 0,
    });
    expect(raidRunReservedTotal(next)).toBe(10);
    expect(clampRaidRunReservedToLimit(next)).toBe(next);
  });

  it('clamps reserved counts on create when they exceed the limit', () => {
    const run = createRaidRun({
      id: 'run-1',
      dungeon: tenPlayerDungeon,
      reservedDps: 18,
      reservedHealer: 3,
      reservedTank: 2,
      reservedBoss: 2,
    });

    expect(run).toMatchObject({
      reservedDps: 10,
      reservedHealer: 0,
      reservedTank: 0,
      reservedBoss: 0,
    });

    expect(
      createRaidRun({
        id: 'run-2',
        dungeon: tenPlayerDungeon,
        reservedDps: 6,
        reservedHealer: 8,
        reservedTank: 5,
        reservedBoss: 4,
      }),
    ).toMatchObject({
      reservedDps: 6,
      reservedHealer: 4,
      reservedTank: 0,
      reservedBoss: 0,
    });
    expect(
      createRaidRun({
        id: 'run-3',
        dungeon: tenPlayerDungeon,
        reservedDps: 2,
        reservedHealer: 2,
        reservedTank: 8,
        reservedBoss: 5,
      }),
    ).toMatchObject({
      reservedDps: 2,
      reservedHealer: 2,
      reservedTank: 6,
      reservedBoss: 0,
    });
    expect(
      createRaidRun({
        id: 'run-4',
        dungeon: tenPlayerDungeon,
        reservedDps: 2,
        reservedHealer: 2,
        reservedTank: 2,
        reservedBoss: 8,
      }),
    ).toMatchObject({
      reservedDps: 2,
      reservedHealer: 2,
      reservedTank: 2,
      reservedBoss: 4,
    });
  });

  it('paints signup roles from reserved counts in column order', () => {
    const run = setRaidRunReservedBoss(
      setRaidRunReservedTank(
        setRaidRunReservedHealer(
          setRaidRunReservedDps(createRaidRun({ id: 'run-1' }), 6),
          2,
        ),
        3,
      ),
      1,
    );

    expect(slotRoles(run)).toEqual([
      ['dps', 'dps', 'dps', 'dps', 'dps'],
      ['dps', 'healer', 'healer', 'tank', 'tank'],
      ['tank', 'boss', 'pending', 'pending', 'pending'],
      ['pending', 'pending', 'pending', 'pending', 'pending'],
      ['pending', 'pending', 'pending', 'pending', 'pending'],
    ]);
  });

  it('clears leftover slot roles when reserved counts shrink', () => {
    const filled = setRaidRunReservedDps(createRaidRun({ id: 'run-1' }), 6);
    const shrunk = setRaidRunReservedDps(filled, 1);

    expect(slotRoles(shrunk)[0]).toEqual([
      'dps',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
    expect(slotRoles(shrunk)[1][0]).toBe('pending');
  });

  it('keeps member data when applying reserved roles', () => {
    const named = updateRaidSignupAt(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      (signup) => setRaidSignupCharacterName(signup, '少侠甲'),
    );
    const next = setRaidRunReservedDps(named, 1);

    expect(next.signups[0][0]).toMatchObject({
      characterName: '少侠甲',
      role: 'dps',
    });
    expect(applyRaidRunReservedToSignups(next).signups[0][0]).toBe(
      next.signups[0][0],
    );
  });

  it('syncs reserved counts from signup roles', () => {
    const painted = updateRaidSignupAt(
      updateRaidSignupAt(
        updateRaidSignupAt(
          updateRaidSignupAt(createRaidRun({ id: 'run-1' }), 1, 1, (signup) =>
            setRaidSignupRole(signup, 'dps'),
          ),
          2,
          1,
          (signup) => setRaidSignupRole(signup, 'healer'),
        ),
        3,
        1,
        (signup) => setRaidSignupRole(signup, 'tank'),
      ),
      4,
      1,
      (signup) => setRaidSignupRole(signup, 'boss'),
    );
    const synced = syncRaidRunReservedFromSignups(painted);

    expect(synced).toMatchObject({
      reservedDps: 1,
      reservedHealer: 1,
      reservedTank: 1,
      reservedBoss: 1,
    });
    expect(syncRaidRunReservedFromSignups(synced)).toBe(synced);
  });

  it('syncs reserved counts without relaying out other slots', () => {
    const painted = setRaidRunReservedDps(createRaidRun({ id: 'run-1' }), 6);
    const next = syncRaidRunReservedFromSignups(
      updateRaidSignupAt(painted, 1, 3, (signup) =>
        setRaidSignupRole(signup, 'healer'),
      ),
    );

    expect(next.reservedDps).toBe(5);
    expect(next.reservedHealer).toBe(1);
    expect(next.signups[0][0].role).toBe('dps');
    expect(next.signups[0][2].role).toBe('healer');
    expect(next.signups[1][0].role).toBe('dps');
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

  it('looks up a signup by group and position', () => {
    const run = createRaidRun({ id: 'run-1' });

    expect(getRaidSignupAt(run, 2, 3)).toMatchObject({
      groupNumber: 2,
      positionNumber: 3,
      role: 'pending',
    });
    expect(getRaidSignupAt(run, 9, 1)).toBeUndefined();
    expect(getRaidSignupAt(run, 1, 9)).toBeUndefined();
  });

  it('swaps signup attributes between two slots', () => {
    const run = updateRaidSignupAt(
      updateRaidSignupAt(createRaidRun({ id: 'run-1' }), 1, 1, (signup) =>
        setRaidSignupCharacterName(setRaidSignupRole(signup, 'tank'), '少侠甲'),
      ),
      2,
      3,
      (signup) =>
        setRaidSignupCharacterName(
          setRaidSignupRole(signup, 'healer'),
          '少侠乙',
        ),
    );
    const sourceId = run.signups[0][0].id;
    const targetId = run.signups[1][2].id;
    const next = swapRaidSignupsAt(
      run,
      { groupNumber: 1, positionNumber: 1 },
      { groupNumber: 2, positionNumber: 3 },
    );

    expect(next.signups[0][0]).toMatchObject({
      id: sourceId,
      groupNumber: 1,
      positionNumber: 1,
      characterName: '少侠乙',
      role: 'healer',
    });
    expect(next.signups[1][2]).toMatchObject({
      id: targetId,
      groupNumber: 2,
      positionNumber: 3,
      characterName: '少侠甲',
      role: 'tank',
    });
    expect(run.signups[0][0].characterName).toBe('少侠甲');
  });

  it('swaps two slots in the same group and ignores invalid swaps', () => {
    const run = updateRaidSignupAt(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      (signup) => setRaidSignupRole(signup, 'dps'),
    );
    const sameGroup = swapRaidSignupsAt(
      run,
      { groupNumber: 1, positionNumber: 1 },
      { groupNumber: 1, positionNumber: 5 },
    );

    expect(sameGroup.signups[0][0].role).toBe('pending');
    expect(sameGroup.signups[0][4].role).toBe('dps');
    expect(
      swapRaidSignupsAt(
        run,
        { groupNumber: 1, positionNumber: 1 },
        { groupNumber: 1, positionNumber: 1 },
      ),
    ).toBe(run);
    expect(
      swapRaidSignupsAt(
        run,
        { groupNumber: 9, positionNumber: 1 },
        { groupNumber: 1, positionNumber: 1 },
      ),
    ).toBe(run);
    expect(
      swapRaidSignupsAt(
        run,
        { groupNumber: 1, positionNumber: 1 },
        { groupNumber: 1, positionNumber: 9 },
      ),
    ).toBe(run);
  });

  it('keeps leader exclusive across the raid', () => {
    const run = setRaidSignupLeaderExclusive(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      true,
    );
    const next = setRaidSignupLeaderExclusive(run, 3, 2, true);
    const cleared = setRaidSignupLeaderExclusive(next, 3, 2, false);

    expect(run.signups[0][0].isLeader).toBe(true);
    expect(next.signups[0][0].isLeader).toBe(false);
    expect(next.signups[2][1].isLeader).toBe(true);
    expect(cleared.signups[2][1].isLeader).toBe(false);
    expect(cleared.signups[0][0].isLeader).toBe(false);
  });

  it('keeps dark-run exclusive across the raid', () => {
    const run = setRaidSignupDarkRunExclusive(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      true,
    );
    const next = setRaidSignupDarkRunExclusive(run, 2, 1, true);

    expect(run.signups[0][0].isDarkRun).toBe(true);
    expect(next.signups[0][0].isDarkRun).toBe(false);
    expect(next.signups[1][0].isDarkRun).toBe(true);
    expect(
      setRaidSignupDarkRunExclusive(next, 2, 1, false).signups[1][0].isDarkRun,
    ).toBe(false);
  });

  it('keeps formation core exclusive within a group', () => {
    const run = setRaidSignupFormationCoreExclusive(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      true,
    );
    const sameGroup = setRaidSignupFormationCoreExclusive(run, 1, 3, true);
    const otherGroup = setRaidSignupFormationCoreExclusive(run, 2, 1, true);

    expect(run.signups[0][0].isFormationCore).toBe(true);
    expect(sameGroup.signups[0][0].isFormationCore).toBe(false);
    expect(sameGroup.signups[0][2].isFormationCore).toBe(true);
    expect(otherGroup.signups[0][0].isFormationCore).toBe(true);
    expect(otherGroup.signups[1][0].isFormationCore).toBe(true);
    expect(
      setRaidSignupFormationCoreExclusive(otherGroup, 2, 1, false).signups[1][0]
        .isFormationCore,
    ).toBe(false);
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

  it('clamps reserved counts when the dungeon keeps the same group count', () => {
    const filled = setRaidRunReservedDps(createRaidRun({ dungeon }), 25);
    const next = setRaidRunDungeon(filled, {
      ...dungeon,
      id: 'dungeon-21',
      name: '21人',
      playerLimit: 21,
    });

    expect(next.totalGroupCount).toBe(5);
    expect(next.reservedDps).toBe(21);
    expect(next.signups[4][0].role).toBe('dps');
    expect(next.signups[4][1].role).toBe('pending');
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

  it('counts occupied non-boss signups for wage shares', () => {
    const run = updateRaidSignupAt(
      updateRaidSignupAt(
        updateRaidSignupAt(
          setRaidRunReservedBoss(createRaidRun({ id: 'run-1' }), 1),
          1,
          1,
          (signup) =>
            setRaidSignupCharacterName(
              setRaidSignupRole(signup, 'dps'),
              '输出',
            ),
        ),
        1,
        2,
        (signup) =>
          setRaidSignupCharacterName(
            setRaidSignupRole(signup, 'healer'),
            ' 治疗 ',
          ),
      ),
      1,
      3,
      (signup) =>
        setRaidSignupCharacterName(setRaidSignupRole(signup, 'boss'), '老板'),
    );

    expect(countRaidRunWageShareSignups(run)).toBe(2);
    expect(run.signups[0][0].role).toBe('dps');
  });

  it('does not count reserved empty slots as wage shares', () => {
    const run = setRaidRunReservedDps(createRaidRun({ id: 'run-1' }), 3);

    expect(run.signups[0][0].role).toBe('dps');
    expect(countRaidRunWageShareSignups(run)).toBe(0);
  });

  it('floors personal wage and returns zero without a share count', () => {
    expect(calculateRaidRunWagePerPerson(15000, 2000, 10)).toBe(1300);
    expect(calculateRaidRunWagePerPerson(1000, 0, 3)).toBe(333);
    expect(calculateRaidRunWagePerPerson(1000, 1000, 5)).toBe(0);
    expect(calculateRaidRunWagePerPerson(1000, 2000, 5)).toBe(0);
    expect(calculateRaidRunWagePerPerson(1000, 0, 0)).toBe(0);
  });
});
