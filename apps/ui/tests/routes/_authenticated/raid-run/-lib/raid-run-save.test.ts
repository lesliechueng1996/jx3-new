import { describe, expect, it } from 'vitest';
import type { RaidRunDetail } from '@/lib/api/raid-runs-api';
import {
  createRaidRun,
  getRaidSignupAt,
  setRaidRunDescription,
  setRaidRunDungeon,
  setRaidRunEndTime,
  setRaidRunGatherTime,
  setRaidRunName,
  setRaidRunRemark,
  setRaidRunReservedTank,
  setRaidSignupDarkRunExclusive,
  setRaidSignupFormationCoreExclusive,
  setRaidSignupLeaderExclusive,
  updateRaidSignupAt,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import {
  raidRunFromDetail,
  raidRunSaveSnapshot,
  raidSignupsForSave,
  toRaidRunSaveBody,
  validateRaidRunForSave,
} from '@/routes/_authenticated/raid-run/-lib/raid-run-save';
import { setRaidSignupCharacterName } from '@/routes/_authenticated/raid-run/-lib/raid-signup';

const dungeon = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '25人英雄',
  playerLimit: 25,
  bossCount: 6,
  difficulty: 'heroic' as const,
};

const tenPlayerDungeon = {
  ...dungeon,
  id: '22222222-2222-4222-8222-222222222222',
  name: '10人普通',
  playerLimit: 10,
  bossCount: 3,
  difficulty: 'normal' as const,
};

const gatherTime = new Date('2026-08-22T12:00:00.000Z');
const startTime = new Date('2026-08-22T13:00:00.000Z');
const endTime = new Date('2026-08-22T16:00:00.000Z');

const validRun = () => {
  let run = createRaidRun({
    name: '周六团',
    dungeon,
    gatherTime,
    startTime,
    endTime,
  });
  run = setRaidRunReservedTank(run, 1);
  run = updateRaidSignupAt(run, 1, 1, (signup) =>
    setRaidSignupCharacterName(signup, '团长'),
  );
  run = setRaidSignupLeaderExclusive(run, 1, 1, true);
  run = setRaidSignupDarkRunExclusive(run, 1, 1, true);
  run = setRaidSignupFormationCoreExclusive(run, 1, 1, true);
  return run;
};

describe('validateRaidRunForSave', () => {
  it('accepts a complete roster', () => {
    expect(validateRaidRunForSave(validRun())).toBeUndefined();
  });

  it('rejects a missing name', () => {
    expect(validateRaidRunForSave(setRaidRunName(validRun(), ''))).toBe(
      '团队名称不能为空,且不能超过64个字符',
    );
  });

  it('rejects a name that is too long', () => {
    expect(
      validateRaidRunForSave(setRaidRunName(validRun(), '啊'.repeat(65))),
    ).toBe('团队名称不能为空,且不能超过64个字符');
  });

  it('rejects a description that is too long', () => {
    expect(
      validateRaidRunForSave(
        setRaidRunDescription(validRun(), '描'.repeat(513)),
      ),
    ).toBe('描述最多 512 个字符');
  });

  it('rejects a remark that is too long', () => {
    expect(
      validateRaidRunForSave(setRaidRunRemark(validRun(), '备'.repeat(513))),
    ).toBe('备注最多 512 个字符');
  });

  it('rejects a missing dungeon', () => {
    expect(validateRaidRunForSave(createRaidRun({ name: '周六团' }))).toBe(
      '相关副本不存在',
    );
  });

  it('rejects gather time after start time', () => {
    expect(
      validateRaidRunForSave(
        setRaidRunGatherTime(validRun(), new Date('2026-08-22T14:00:00.000Z')),
      ),
    ).toBe('集合时间不能大于进本时间');
  });

  it('rejects start time after end time', () => {
    expect(
      validateRaidRunForSave(
        setRaidRunEndTime(validRun(), new Date('2026-08-22T12:30:00.000Z')),
      ),
    ).toBe('进本时间不能大于结束时间');
  });

  it('rejects an empty signup list', () => {
    const run = setRaidRunDungeon(
      createRaidRun({ name: '周六团', dungeon }),
      dungeon,
    );
    expect(validateRaidRunForSave(setRaidRunName(run, '周六团'))).toBe(
      '报名人数须为1-100人',
    );
  });

  it('rejects tank reserved mismatch', () => {
    expect(validateRaidRunForSave(setRaidRunReservedTank(validRun(), 2))).toBe(
      '坦克预留人数不匹配',
    );
  });

  it('rejects boss reserved mismatch', () => {
    expect(
      validateRaidRunForSave({
        ...validRun(),
        reservedBoss: 1,
      }),
    ).toBe('老板预留人数不匹配');
  });

  it('rejects duplicate positions', () => {
    const run = validRun();
    const slot = getRaidSignupAt(run, 1, 1);
    expect(slot).toBeDefined();
    if (!slot) {
      return;
    }
    expect(
      validateRaidRunForSave({
        ...run,
        reservedTank: 2,
        signups: [
          [
            slot,
            {
              ...slot,
              id: 'dup',
              characterName: '另一个',
              isLeader: false,
              isDarkRun: false,
              isFormationCore: false,
            },
          ],
        ],
      }),
    ).toBe('小队位置重复');
  });

  it('accepts a matching kungfu and school', () => {
    const run = updateRaidSignupAt(validRun(), 1, 1, (signup) => ({
      ...signup,
      kungfuId: 'kungfu-1',
      schoolId: 'school-1',
    }));

    expect(
      validateRaidRunForSave(run, {
        kungfus: [{ id: 'kungfu-1', schoolId: 'school-1' }],
      }),
    ).toBeUndefined();
  });

  it('rejects healer reserved mismatch', () => {
    expect(
      validateRaidRunForSave({
        ...validRun(),
        reservedHealer: 1,
      }),
    ).toBe('治疗预留人数不匹配');
  });

  it('rejects when there is no leader', () => {
    expect(
      validateRaidRunForSave(
        setRaidSignupLeaderExclusive(validRun(), 1, 1, false),
      ),
    ).toBe('团长人数不匹配，应为1人');
  });

  it('rejects when there is no dark run', () => {
    expect(
      validateRaidRunForSave(
        setRaidSignupDarkRunExclusive(validRun(), 1, 1, false),
      ),
    ).toBe('黑本人数不匹配，应为1人');
  });

  it('rejects a missing formation core', () => {
    expect(
      validateRaidRunForSave(
        setRaidSignupFormationCoreExclusive(validRun(), 1, 1, false),
      ),
    ).toBe('阵眼人数不匹配，每个小队应只有1个阵眼');
  });

  it('rejects a kungfu and school mismatch when kungfus are provided', () => {
    const run = updateRaidSignupAt(validRun(), 1, 1, (signup) => ({
      ...signup,
      kungfuId: 'kungfu-1',
      schoolId: 'school-2',
    }));

    expect(
      validateRaidRunForSave(run, {
        kungfus: [{ id: 'kungfu-1', schoolId: 'school-1' }],
      }),
    ).toBe('相关报名信息中存在心法与门派不匹配');
  });

  it('skips kungfu school checks when a signup omits one of the ids', () => {
    const run = updateRaidSignupAt(validRun(), 1, 1, (signup) => ({
      ...signup,
      kungfuId: 'kungfu-1',
      schoolId: undefined,
    }));

    expect(
      validateRaidRunForSave(run, {
        kungfus: [{ id: 'kungfu-1', schoolId: 'school-1' }],
      }),
    ).toBeUndefined();
  });

  it('rejects when submitted players exceed the dungeon limit', () => {
    let run = createRaidRun({
      name: '周六团',
      dungeon: { ...dungeon, playerLimit: 1 },
      gatherTime,
      startTime,
      endTime,
    });
    run = setRaidRunDungeon(run, { ...dungeon, playerLimit: 1 });
    run = setRaidRunReservedTank(run, 1);
    run = updateRaidSignupAt(run, 1, 1, (signup) =>
      setRaidSignupCharacterName(signup, '团长'),
    );
    run = setRaidSignupLeaderExclusive(run, 1, 1, true);
    run = setRaidSignupDarkRunExclusive(run, 1, 1, true);
    run = setRaidSignupFormationCoreExclusive(run, 1, 1, true);
    const firstSlot = getRaidSignupAt(run, 1, 1);
    expect(firstSlot).toBeDefined();
    if (!firstSlot) {
      return;
    }
    run = {
      ...run,
      signups: [
        [
          firstSlot,
          {
            ...firstSlot,
            id: 'extra',
            positionNumber: 2,
            characterName: '多余',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
          },
        ],
      ],
      reservedTank: 2,
    };

    expect(validateRaidRunForSave(run)).toBe('超出副本人数限制');
  });

  it('rejects a group number beyond the dungeon size', () => {
    let run = validRun();
    const firstSlot = getRaidSignupAt(run, 1, 1);
    expect(firstSlot).toBeDefined();
    if (!firstSlot) {
      return;
    }
    run = setRaidRunDungeon(run, tenPlayerDungeon);
    run = {
      ...run,
      dungeon: tenPlayerDungeon,
      signups: [
        [
          {
            ...firstSlot,
            groupNumber: 5,
            characterName: '团长',
            role: 'tank',
            isLeader: true,
            isDarkRun: true,
            isFormationCore: true,
          },
        ],
      ],
      reservedTank: 1,
      reservedHealer: 0,
      reservedDps: 0,
      reservedBoss: 0,
    };

    expect(validateRaidRunForSave(run)).toBe(
      '小队编号超出副本人数对应的小队数',
    );
  });
});

describe('toRaidRunSaveBody', () => {
  it('omits empty slots and optional signup ids', () => {
    const body = toRaidRunSaveBody(validRun(), { includeSignupIds: false });

    expect(body.name).toBe('周六团');
    expect(body.dungeonId).toBe(dungeon.id);
    expect(body.signups).toHaveLength(1);
    expect(body.signups[0]?.id).toBeUndefined();
    expect(body.signups[0]?.characterName).toBe('团长');
    expect(raidSignupsForSave(validRun())).toHaveLength(1);
  });

  it('uses an empty dungeon id when none is selected', () => {
    const body = toRaidRunSaveBody(createRaidRun({ name: '周六团' }), {
      includeSignupIds: false,
    });
    expect(body.dungeonId).toBe('');
    expect(body.signups).toHaveLength(0);
  });

  it('includes signup ids when requested and drops blank optional text', () => {
    const run = setRaidRunDescription(
      setRaidRunRemark(validRun(), '  '),
      ' 简介 ',
    );
    const body = toRaidRunSaveBody(run, { includeSignupIds: true });

    expect(body.description).toBe('简介');
    expect(body.remark).toBeUndefined();
    expect(body.signups[0]?.id).toBe(getRaidSignupAt(run, 1, 1)?.id);
  });
});

describe('raidRunSaveSnapshot', () => {
  it('ignores status and wage fields', () => {
    const run = validRun();
    const next = {
      ...run,
      status: 'recruiting' as const,
      totalIncome: 9,
      gameRaidId: 'game-1',
      dungeonInput: 'changed',
    };

    expect(raidRunSaveSnapshot(run)).toBe(raidRunSaveSnapshot(next));
  });

  it('changes when the roster changes', () => {
    const run = validRun();
    const next = setRaidRunName(run, '周日团');

    expect(raidRunSaveSnapshot(run)).not.toBe(raidRunSaveSnapshot(next));
  });
});

describe('raidRunFromDetail', () => {
  const detail: RaidRunDetail = {
    id: 'run-1',
    name: '周六团',
    description: null,
    status: 'recruiting',
    dungeonId: dungeon.id,
    dungeon,
    gatherTime: gatherTime.toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    reservedTank: 1,
    reservedHealer: 0,
    reservedDps: 0,
    reservedBoss: 0,
    remark: null,
    gameRaidId: null,
    totalIncome: 0,
    subsidyAmount: 0,
    wagePerPerson: 0,
    signups: [
      {
        id: 'signup-1',
        groupNumber: 1,
        positionNumber: 1,
        role: 'tank',
        isLeader: true,
        isDarkRun: true,
        isFormationCore: true,
        serverId: null,
        characterName: '团长',
        schoolId: null,
        kungfuId: null,
        remark: null,
      },
      {
        id: 'signup-2',
        groupNumber: null,
        positionNumber: null,
        role: 'dps',
        isLeader: false,
        isDarkRun: false,
        isFormationCore: false,
        serverId: null,
        characterName: '跳过',
        schoolId: null,
        kungfuId: null,
        remark: null,
      },
    ],
  };

  it('hydrates the grid and keeps server signup ids', () => {
    const run = raidRunFromDetail(detail);

    expect(run.id).toBe('run-1');
    expect(run.status).toBe('recruiting');
    expect(run.dungeon?.id).toBe(dungeon.id);
    expect(getRaidSignupAt(run, 1, 1)?.id).toBe('signup-1');
    expect(getRaidSignupAt(run, 1, 1)?.characterName).toBe('团长');
    expect(run.signups.flat().some((signup) => signup.id === 'signup-2')).toBe(
      false,
    );
  });

  it('uses current dates when gather and end times are missing', () => {
    const run = raidRunFromDetail({
      ...detail,
      gatherTime: null,
      endTime: null,
    });

    expect(run.gatherTime).toBeInstanceOf(Date);
    expect(run.endTime).toBeInstanceOf(Date);
  });
});
