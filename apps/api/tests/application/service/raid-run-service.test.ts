import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { CreateRaidRunBody } from '@api/interface/schema/raid-run-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const findDungeonById = mock(async () => null as DungeonRow | null);
const countServersByIds = mock(async (_ids: string[]) => 0);
const countSchoolsByIds = mock(async (_ids: string[]) => 0);
const countKungfusByIds = mock(async (_ids: string[]) => 0);
const findKungfusByIds = mock(
  async (_ids: string[]) => [] as Array<{ id: string; schoolId: string }>,
);
const createWithSignups = mock<
  (data: {
    createdBy: string;
    signups: Array<{ isReserved: boolean }>;
  }) => Promise<{ id: string }>
>(() => Promise.resolve({ id: 'raid-run-1' }));
const findById = mock(async (_id: string) => null as RaidRunRow | null);
const findDetailById = mock(async (_id: string) => null as DetailRow | null);
const updateById = mock(
  async (_id: string, _values: Record<string, string>) =>
    null as Record<string, string | null> | null,
);
const updateStatus = mock(
  async (_id: string, _status: string, _signupStatus?: string) =>
    null as Record<string, string | null> | null,
);
const updateWithSignups = mock(
  async (
    _id: string,
    _values: Record<string, unknown>,
    _sync: Record<string, unknown>,
  ) => null as { id: string } | null,
);
const findSignupsByRaidRunId = mock(async (_id: string) => [] as SignupRow[]);
const findSignupsByIds = mock(async (_ids: string[]) => [] as SignupRow[]);
const buildWhereClause = mock((_query: unknown) => undefined as unknown);
const listPagination = mock(
  async (_where: unknown, _limit: number, _offset: number) =>
    [] as RaidRunListRow[],
);
const count = mock(
  async (_where: unknown) =>
    [{ total: 0 }] as Array<{
      total: number;
    }>,
);
const deleteWithChildren = mock(async (_id: string) => undefined);
const formatDateTimeToMinute = mock(
  (date: Date) => `min:${date.toISOString()}`,
);
const shiftToTodayKeepingTime = mock((value: Date | null) => value);

type RaidRunRow = {
  id: string;
  status?: 'pending' | 'recruiting' | 'ongoing' | 'completed' | 'cancelled';
};

type SignupRow = {
  id: string;
  raidRunId: string;
};

type DetailRow = {
  run: {
    id: string;
    name: string;
    description: string | null;
    status: 'pending' | 'recruiting' | 'ongoing' | 'completed' | 'cancelled';
    dungeonId: string;
    gatherTime: Date | null;
    startTime: Date;
    endTime: Date | null;
    reservedTank: number;
    reservedHealer: number;
    reservedDps: number;
    reservedBoss: number;
    remark: string | null;
    gameRaidId: string | null;
    totalIncome: string | null;
    subsidyAmount: string | null;
    wagePerPerson: string | null;
  };
  dungeon: {
    id: string;
    name: string;
    playerLimit: number;
    bossCount: number;
    difficulty: 'normal' | 'heroic' | 'challenge';
  } | null;
  signups: Array<{
    id: string;
    groupNumber: number | null;
    positionNumber: number | null;
    role: 'pending' | 'tank' | 'healer' | 'dps' | 'boss';
    status: 'pending' | 'confirmed' | 'waitlist' | 'rejected';
    isReserved: boolean;
    isLeader: boolean;
    isDarkRun: boolean;
    isFormationCore: boolean;
    serverId: string | null;
    characterName: string | null;
    schoolId: string | null;
    kungfuId: string | null;
    userId: string | null;
    remark: string | null;
  }>;
};

type RaidRunListRow = {
  id: string;
  name: string;
  status: 'pending' | 'recruiting' | 'ongoing' | 'completed' | 'cancelled';
  gameRaidId: string | null;
  dungeonId: string;
  dungeonName: string | null;
  dungeonPlayerLimit: number | null;
  dungeonDifficulty: 'normal' | 'heroic' | 'challenge' | null;
  startTime: Date;
  endTime: Date | null;
  reservedTank: number;
  reservedHealer: number;
  reservedDps: number;
  reservedBoss: number;
  totalIncome: string | null;
  wagePerPerson: string | null;
  subsidyAmount: string | null;
  signupCount: number;
};

type DungeonRow = {
  id: string;
  playerLimit: number;
};

const dungeonId = '11111111-1111-4111-8111-111111111111';
const serverId = '22222222-2222-4222-8222-222222222222';
const schoolId = '33333333-3333-4333-8333-333333333333';
const kungfuId = '44444444-4444-4444-8444-444444444444';
const otherSchoolId = '55555555-5555-4555-8555-555555555555';
const userId = 'user-1';

const gatherTime = new Date('2026-08-22T12:00:00.000Z');
const startTime = new Date('2026-08-22T13:00:00.000Z');
const endTime = new Date('2026-08-22T16:00:00.000Z');

const dungeonRow = (overrides: Partial<DungeonRow> = {}): DungeonRow => ({
  id: dungeonId,
  playerLimit: 25,
  ...overrides,
});

type SignupInput = CreateRaidRunBody['signups'][number];

const signup = (overrides: Partial<SignupInput> = {}): SignupInput => ({
  groupNumber: 1,
  positionNumber: 1,
  role: 'tank',
  isLeader: true,
  isDarkRun: true,
  isFormationCore: true,
  characterName: '团长',
  ...overrides,
});

const pendingSlot = (
  groupNumber: number,
  positionNumber: number,
): SignupInput =>
  signup({
    groupNumber,
    positionNumber,
    role: 'pending',
    isLeader: false,
    isDarkRun: false,
    isFormationCore: false,
    characterName: undefined,
  });

const fullRoster = (filled: SignupInput[], playerLimit = 25): SignupInput[] => {
  const byKey = new Map(
    filled.map((item) => [`${item.groupNumber}:${item.positionNumber}`, item]),
  );
  const slots: SignupInput[] = [];
  let groupNumber = 1;
  let positionNumber = 1;
  while (slots.length < playerLimit) {
    slots.push(
      byKey.get(`${groupNumber}:${positionNumber}`) ??
        pendingSlot(groupNumber, positionNumber),
    );
    positionNumber += 1;
    if (positionNumber > 5) {
      positionNumber = 1;
      groupNumber += 1;
    }
  }
  return slots;
};

const validBody = (
  overrides: Partial<CreateRaidRunBody> = {},
  playerLimit = 25,
): CreateRaidRunBody => {
  const { signups, ...rest } = overrides;
  const roster =
    signups && signups.length === playerLimit
      ? signups
      : fullRoster(signups ?? [signup()], playerLimit);
  return {
    name: '周六团',
    dungeonId,
    gatherTime,
    startTime,
    endTime,
    reservedTank: 1,
    reservedHealer: 0,
    reservedDps: 0,
    reservedBoss: 0,
    signups: roster,
    ...rest,
  };
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/game-dungeon-repository', () => ({
  gameDungeonRepository: {
    findById: findDungeonById,
  },
}));

mock.module('@api/infrastructure/repository/game-server-repository', () => ({
  gameServerRepository: {
    countByIds: countServersByIds,
  },
}));

mock.module('@api/infrastructure/repository/school-repository', () => ({
  schoolRepository: {
    countByIds: countSchoolsByIds,
  },
}));

mock.module('@api/infrastructure/repository/kungfu-repository', () => ({
  kungfuRepository: {
    countByIds: countKungfusByIds,
    findByIds: findKungfusByIds,
  },
}));

mock.module('@api/infrastructure/repository/raid-run-repository', () => ({
  raidRunRepository: {
    createWithSignups,
    findById,
    findDetailById,
    updateById,
    updateStatus,
    updateWithSignups,
    buildWhereClause,
    listPagination,
    count,
    deleteWithChildren,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTimeToMinute,
  shiftToTodayKeepingTime,
}));

mock.module('@api/infrastructure/repository/raid-signup-repository', () => ({
  raidSignupRepository: {
    findByRaidRunId: findSignupsByRaidRunId,
    findByIds: findSignupsByIds,
  },
}));

const {
  copyRaidRun,
  createRaidRun,
  deleteAdminRaidRun,
  getRaidRun,
  listAdminRaidRuns,
  saveRaidRun,
  updateRaidRunGameRaidId,
  updateRaidRunStatus,
  updateRaidRunWages,
} = await import('@api/application/service/raid-run-service');

const expectBadRequest = async (
  body: CreateRaidRunBody,
  code: string,
  message: string,
) => {
  try {
    await createRaidRun(body, userId);
    throw new Error('expected BadRequestException');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).code).toBe(code);
    expect((error as BadRequestException).message).toBe(message);
  }
};

describe('createRaidRun', () => {
  beforeEach(() => {
    findDungeonById.mockReset();
    countServersByIds.mockReset();
    countSchoolsByIds.mockReset();
    countKungfusByIds.mockReset();
    findKungfusByIds.mockReset();
    createWithSignups.mockReset();
    findById.mockReset();
    findDetailById.mockReset();
    updateById.mockReset();
    updateWithSignups.mockReset();
    findSignupsByRaidRunId.mockReset();
    findSignupsByIds.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();

    findDungeonById.mockResolvedValue(dungeonRow());
    countServersByIds.mockResolvedValue(0);
    countSchoolsByIds.mockResolvedValue(0);
    countKungfusByIds.mockResolvedValue(0);
    findKungfusByIds.mockResolvedValue([]);
    createWithSignups.mockResolvedValue({ id: 'raid-run-1' });
  });

  it('creates a raid run when the roster is valid', async () => {
    const result = await createRaidRun(validBody(), userId);

    expect(result.id).toBe('raid-run-1');
    expect(createWithSignups).toHaveBeenCalledTimes(1);
    expect(countServersByIds).not.toHaveBeenCalled();
    expect(countSchoolsByIds).not.toHaveBeenCalled();
    expect(countKungfusByIds).not.toHaveBeenCalled();
    expect(findKungfusByIds).not.toHaveBeenCalled();
    expect(createWithSignups).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: userId,
        signups: expect.arrayContaining([
          expect.objectContaining({
            isReserved: false,
            characterName: '团长',
          }),
        ]),
      }),
    );
    expect(createWithSignups.mock.calls[0]?.[0].signups).toHaveLength(25);
    const createdSignups = createWithSignups.mock.calls[0]?.[0].signups ?? [];
    expect(
      (createdSignups[0] as { id?: string } | undefined)?.id,
    ).toBeUndefined();
    expect(logger.info).toHaveBeenCalled();
  });

  it('deduplicates referenced ids before counting', async () => {
    countServersByIds.mockResolvedValue(1);
    countSchoolsByIds.mockResolvedValue(1);
    countKungfusByIds.mockResolvedValue(1);
    findKungfusByIds.mockResolvedValue([{ id: kungfuId, schoolId }]);

    const body = validBody({
      reservedTank: 1,
      reservedHealer: 1,
      signups: [
        signup({
          serverId,
          schoolId,
          kungfuId,
        }),
        signup({
          groupNumber: 1,
          positionNumber: 2,
          role: 'healer',
          isLeader: false,
          isDarkRun: false,
          isFormationCore: false,
          characterName: '治疗',
          serverId,
          schoolId,
          kungfuId,
        }),
      ],
    });

    await createRaidRun(body, userId);

    expect(countServersByIds).toHaveBeenCalledWith([serverId]);
    expect(countSchoolsByIds).toHaveBeenCalledWith([schoolId]);
    expect(countKungfusByIds).toHaveBeenCalledWith([kungfuId]);
  });

  it('rejects gather time after start time', async () => {
    await expectBadRequest(
      validBody({ gatherTime: new Date('2026-08-22T14:00:00.000Z') }),
      ERROR_CODES.RAID_RUN_TIME_INVALID,
      '集合时间不能大于进本时间',
    );
    expect(createWithSignups).not.toHaveBeenCalled();
  });

  it('rejects start time after end time', async () => {
    await expectBadRequest(
      validBody({ endTime: new Date('2026-08-22T12:30:00.000Z') }),
      ERROR_CODES.RAID_RUN_TIME_INVALID,
      '进本时间不能大于结束时间',
    );
  });

  it('rejects a missing dungeon', async () => {
    findDungeonById.mockResolvedValue(null);

    try {
      await createRaidRun(validBody(), userId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
      );
    }
  });

  it('rejects a roster larger than the dungeon player limit', async () => {
    findDungeonById.mockResolvedValue(dungeonRow({ playerLimit: 1 }));

    await expectBadRequest(
      validBody(
        {
          reservedTank: 1,
          reservedHealer: 1,
          signups: [
            signup(),
            signup({
              positionNumber: 2,
              role: 'healer',
              isLeader: false,
              isDarkRun: false,
              isFormationCore: false,
              characterName: '治疗',
            }),
          ],
        },
        2,
      ),
      ERROR_CODES.RAID_RUN_PLAYER_LIMIT_EXCEEDED,
      '报名人数须与副本人数上限一致',
    );
  });

  it('rejects a group number beyond the dungeon size', async () => {
    findDungeonById.mockResolvedValue(dungeonRow({ playerLimit: 5 }));

    await expectBadRequest(
      validBody(
        {
          signups: [
            signup({ groupNumber: 2 }),
            pendingSlot(1, 2),
            pendingSlot(1, 3),
            pendingSlot(1, 4),
            pendingSlot(1, 5),
          ],
        },
        5,
      ),
      ERROR_CODES.RAID_RUN_GROUP_NUMBER_INVALID,
      '小队编号超出副本人数对应的小队数',
    );
  });

  it('rejects a tank reserved count mismatch', async () => {
    await expectBadRequest(
      validBody({ reservedTank: 2 }),
      ERROR_CODES.RAID_RUN_RESERVED_TANK_MISMATCH,
      '坦克预留人数不匹配',
    );
  });

  it('creates a raid run with empty reserved tank slots', async () => {
    const result = await createRaidRun(
      validBody({
        reservedTank: 2,
        reservedDps: 1,
        signups: [
          signup({
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
            characterName: undefined,
          }),
          signup({
            positionNumber: 2,
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
            characterName: undefined,
          }),
          signup({
            positionNumber: 3,
            role: 'dps',
            characterName: '输出',
          }),
        ],
      }),
      userId,
    );

    expect(result.id).toBe('raid-run-1');
    expect(createWithSignups).toHaveBeenCalledWith(
      expect.objectContaining({
        signups: expect.arrayContaining([
          expect.objectContaining({
            role: 'tank',
            characterName: null,
          }),
          expect.objectContaining({
            role: 'tank',
            characterName: null,
          }),
          expect.objectContaining({
            role: 'dps',
            characterName: '输出',
          }),
        ]),
      }),
    );
    expect(createWithSignups.mock.calls[0]?.[0].signups).toHaveLength(25);
  });

  it('rejects a healer reserved count mismatch', async () => {
    await expectBadRequest(
      validBody({ reservedHealer: 1 }),
      ERROR_CODES.RAID_RUN_RESERVED_HEALER_MISMATCH,
      '治疗预留人数不匹配',
    );
  });

  it('rejects a dps reserved count mismatch', async () => {
    await expectBadRequest(
      validBody({ reservedDps: 1 }),
      ERROR_CODES.RAID_RUN_RESERVED_DPS_MISMATCH,
      'DPS预留人数不匹配',
    );
  });

  it('rejects a boss reserved count mismatch', async () => {
    await expectBadRequest(
      validBody({ reservedBoss: 1 }),
      ERROR_CODES.RAID_RUN_RESERVED_BOSS_MISMATCH,
      '老板预留人数不匹配',
    );
  });

  it('rejects duplicate group and position pairs', async () => {
    findDungeonById.mockResolvedValue(dungeonRow({ playerLimit: 2 }));

    await expectBadRequest(
      validBody(
        {
          reservedTank: 1,
          reservedHealer: 1,
          signups: [
            signup(),
            signup({
              role: 'healer',
              isLeader: false,
              isDarkRun: false,
              isFormationCore: false,
              characterName: '治疗',
            }),
          ],
        },
        2,
      ),
      ERROR_CODES.RAID_RUN_DUPLICATE_POSITION,
      '小队位置重复',
    );
  });

  it('rejects missing servers referenced by signups', async () => {
    countServersByIds.mockResolvedValue(0);

    try {
      await createRaidRun(
        validBody({
          signups: [signup({ serverId })],
        }),
        userId,
      );
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_SERVER_NOT_FOUND,
      );
    }
  });

  it('rejects missing schools referenced by signups', async () => {
    countSchoolsByIds.mockResolvedValue(0);

    try {
      await createRaidRun(
        validBody({
          signups: [signup({ schoolId })],
        }),
        userId,
      );
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_SCHOOL_NOT_FOUND,
      );
    }
  });

  it('rejects missing kungfus referenced by signups', async () => {
    countKungfusByIds.mockResolvedValue(0);

    try {
      await createRaidRun(
        validBody({
          signups: [signup({ kungfuId })],
        }),
        userId,
      );
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_KUNGFU_NOT_FOUND,
      );
    }
  });

  it('rejects a kungfu that does not belong to the signup school', async () => {
    countSchoolsByIds.mockResolvedValue(1);
    countKungfusByIds.mockResolvedValue(1);
    findKungfusByIds.mockResolvedValue([
      { id: kungfuId, schoolId: otherSchoolId },
    ]);

    await expectBadRequest(
      validBody({
        signups: [signup({ schoolId, kungfuId })],
      }),
      ERROR_CODES.RAID_RUN_KUNGFU_SCHOOL_MISMATCH,
      '相关报名信息中存在心法与门派不匹配',
    );
  });

  it('skips kungfu-school checks when school or kungfu is omitted', async () => {
    countSchoolsByIds.mockResolvedValue(1);
    countKungfusByIds.mockResolvedValue(1);
    findKungfusByIds.mockResolvedValue([{ id: kungfuId, schoolId }]);

    await createRaidRun(
      validBody({
        reservedTank: 1,
        reservedHealer: 1,
        signups: [
          signup({ kungfuId }),
          signup({
            positionNumber: 2,
            role: 'healer',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
            characterName: '治疗',
            schoolId,
          }),
        ],
      }),
      userId,
    );

    expect(createWithSignups).toHaveBeenCalledTimes(1);
  });

  it('rejects a roster without exactly one leader', async () => {
    await expectBadRequest(
      validBody({
        reservedTank: 1,
        reservedHealer: 1,
        signups: [
          signup({ isLeader: false }),
          signup({
            positionNumber: 2,
            role: 'healer',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
            characterName: '治疗',
          }),
        ],
      }),
      ERROR_CODES.RAID_RUN_LEADER_COUNT_INVALID,
      '团长人数不匹配，应为1人',
    );
  });

  it('rejects a roster without exactly one dark-run player', async () => {
    await expectBadRequest(
      validBody({
        reservedTank: 1,
        reservedHealer: 1,
        signups: [
          signup({ isDarkRun: false }),
          signup({
            positionNumber: 2,
            role: 'healer',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
            characterName: '治疗',
          }),
        ],
      }),
      ERROR_CODES.RAID_RUN_DARK_RUN_COUNT_INVALID,
      '黑本人数不匹配，应为1人',
    );
  });

  it('accepts a group without a formation core', async () => {
    await createRaidRun(
      validBody({
        signups: [signup({ isFormationCore: false })],
      }),
      userId,
    );

    expect(createWithSignups).toHaveBeenCalledTimes(1);
  });

  it('rejects a group with more than one formation core', async () => {
    await expectBadRequest(
      validBody({
        reservedTank: 1,
        reservedHealer: 1,
        signups: [
          signup(),
          signup({
            positionNumber: 2,
            role: 'healer',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: true,
            characterName: '治疗',
          }),
        ],
      }),
      ERROR_CODES.RAID_RUN_FORMATION_CORE_INVALID,
      '阵眼人数不匹配，每个小队最多1个阵眼',
    );
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    createWithSignups.mockRejectedValue(failure);

    try {
      await createRaidRun(validBody(), userId);
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

const raidRunId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('updateRaidRunGameRaidId', () => {
  beforeEach(() => {
    findById.mockReset();
    updateById.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    findById.mockResolvedValue({ id: raidRunId });
    updateById.mockResolvedValue({ gameRaidId: 'game-123' });
  });

  it('updates the game raid id', async () => {
    const result = await updateRaidRunGameRaidId(raidRunId, '  game-123  ');

    expect(result).toEqual({ gameRaidId: 'game-123' });
    expect(updateById).toHaveBeenCalledWith(raidRunId, {
      gameRaidId: 'game-123',
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects a blank game raid id', async () => {
    try {
      await updateRaidRunGameRaidId(raidRunId, '   ');
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(ERROR_CODES.BAD_REQUEST);
      expect(findById).not.toHaveBeenCalled();
    }
  });

  it('throws when the raid run is missing', async () => {
    findById.mockResolvedValue(null);

    try {
      await updateRaidRunGameRaidId(raidRunId, 'game-123');
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
      expect(updateById).not.toHaveBeenCalled();
    }
  });

  it('throws when the update returns no row', async () => {
    updateById.mockResolvedValue(null);

    try {
      await updateRaidRunGameRaidId(raidRunId, 'game-123');
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
  });

  it('falls back to the trimmed id when the stored value is null', async () => {
    updateById.mockResolvedValue({ gameRaidId: null });

    const result = await updateRaidRunGameRaidId(raidRunId, 'game-123');

    expect(result).toEqual({ gameRaidId: 'game-123' });
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    updateById.mockRejectedValue(failure);

    try {
      await updateRaidRunGameRaidId(raidRunId, 'game-123');
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

describe('updateRaidRunWages', () => {
  beforeEach(() => {
    findById.mockReset();
    updateById.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    findById.mockResolvedValue({ id: raidRunId });
    updateById.mockResolvedValue({
      totalIncome: '15000',
      subsidyAmount: '2000',
      wagePerPerson: '1300',
    });
  });

  it('updates wage fields as integer gold', async () => {
    const result = await updateRaidRunWages(raidRunId, {
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    });

    expect(result).toEqual({
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    });
    expect(updateById).toHaveBeenCalledWith(raidRunId, {
      totalIncome: '15000',
      subsidyAmount: '2000',
      wagePerPerson: '1300',
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects a subsidy greater than total income', async () => {
    try {
      await updateRaidRunWages(raidRunId, {
        totalIncome: 1000,
        subsidyAmount: 1001,
        wagePerPerson: 0,
      });
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_WAGE_INVALID,
      );
      expect(findById).not.toHaveBeenCalled();
    }
  });

  it('throws when the raid run is missing', async () => {
    findById.mockResolvedValue(null);

    try {
      await updateRaidRunWages(raidRunId, {
        totalIncome: 1000,
        subsidyAmount: 0,
        wagePerPerson: 0,
      });
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
  });

  it('throws when the update returns no row', async () => {
    updateById.mockResolvedValue(null);

    try {
      await updateRaidRunWages(raidRunId, {
        totalIncome: 1000,
        subsidyAmount: 0,
        wagePerPerson: 0,
      });
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('coerces blank and invalid numeric columns to zero', async () => {
    updateById.mockResolvedValue({
      totalIncome: null,
      subsidyAmount: '',
      wagePerPerson: 'not-a-number',
    });

    const result = await updateRaidRunWages(raidRunId, {
      totalIncome: 0,
      subsidyAmount: 0,
      wagePerPerson: 0,
    });

    expect(result).toEqual({
      totalIncome: 0,
      subsidyAmount: 0,
      wagePerPerson: 0,
    });
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    updateById.mockRejectedValue(failure);

    try {
      await updateRaidRunWages(raidRunId, {
        totalIncome: 1000,
        subsidyAmount: 0,
        wagePerPerson: 0,
      });
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

const signupId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherSignupId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const defaultDetailRun = {
  id: raidRunId,
  name: '周六团',
  description: null as string | null,
  status: 'pending' as const,
  dungeonId,
  gatherTime,
  startTime,
  endTime,
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  remark: null as string | null,
  gameRaidId: null as string | null,
  totalIncome: null as string | null,
  subsidyAmount: '0' as string | null,
  wagePerPerson: '' as string | null,
};

const defaultDetailDungeon = {
  id: dungeonId,
  name: '25人英雄',
  playerLimit: 25,
  bossCount: 6,
  difficulty: 'heroic' as const,
};

const defaultDetailSignup = {
  id: signupId,
  groupNumber: 1 as number | null,
  positionNumber: 1 as number | null,
  role: 'tank' as const,
  status: 'confirmed' as const,
  isReserved: true,
  isLeader: true,
  isDarkRun: true,
  isFormationCore: true,
  serverId: null as string | null,
  characterName: '团长' as string | null,
  schoolId: null as string | null,
  kungfuId: null as string | null,
  userId: 'signup-user-1' as string | null,
  remark: '原备注' as string | null,
};

const detailRow = (overrides: Partial<DetailRow> = {}): DetailRow => ({
  run: {
    ...defaultDetailRun,
    ...overrides.run,
  },
  dungeon:
    overrides.dungeon === undefined ? defaultDetailDungeon : overrides.dungeon,
  signups: overrides.signups ?? [defaultDetailSignup],
});

describe('getRaidRun', () => {
  beforeEach(() => {
    findDetailById.mockReset();
    findDetailById.mockResolvedValue(detailRow());
  });

  it('returns a mapped raid run detail', async () => {
    const result = await getRaidRun(raidRunId);

    expect(result.id).toBe(raidRunId);
    expect(result.status).toBe('pending');
    expect(result.dungeon.name).toBe('25人英雄');
    expect(result.gatherTime).toBe(gatherTime.toISOString());
    expect(result.startTime).toBe(startTime.toISOString());
    expect(result.endTime).toBe(endTime.toISOString());
    expect(result.totalIncome).toBe(0);
    expect(result.subsidyAmount).toBe(0);
    expect(result.wagePerPerson).toBe(0);
    expect(result.signups).toHaveLength(1);
    expect(result.signups[0]?.id).toBe(signupId);
  });

  it('throws when the raid run is missing', async () => {
    findDetailById.mockResolvedValue(null);

    try {
      await getRaidRun(raidRunId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
  });

  it('throws when the dungeon is missing', async () => {
    findDetailById.mockResolvedValue(
      detailRow({
        dungeon: null,
      }),
    );

    try {
      await getRaidRun(raidRunId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
      );
    }
  });

  it('maps null times and truncates invalid gold', async () => {
    findDetailById.mockResolvedValue(
      detailRow({
        run: {
          ...defaultDetailRun,
          gatherTime: null,
          endTime: null,
          wagePerPerson: 'not-a-number',
        },
      }),
    );

    const result = await getRaidRun(raidRunId);

    expect(result.gatherTime).toBeNull();
    expect(result.endTime).toBeNull();
    expect(result.wagePerPerson).toBe(0);
  });
});

describe('saveRaidRun', () => {
  beforeEach(() => {
    findDungeonById.mockReset();
    countServersByIds.mockReset();
    countSchoolsByIds.mockReset();
    countKungfusByIds.mockReset();
    findKungfusByIds.mockReset();
    findById.mockReset();
    findDetailById.mockReset();
    updateWithSignups.mockReset();
    findSignupsByRaidRunId.mockReset();
    findSignupsByIds.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();

    findDungeonById.mockResolvedValue(dungeonRow());
    findById.mockResolvedValue({ id: raidRunId });
    findDetailById.mockResolvedValue(detailRow());
    updateWithSignups.mockResolvedValue({ id: raidRunId });
    findSignupsByRaidRunId.mockResolvedValue([{ id: signupId, raidRunId }]);
    findSignupsByIds.mockResolvedValue([]);
  });

  it('updates matching signups and keeps their ids', async () => {
    const result = await saveRaidRun(
      raidRunId,
      validBody({
        signups: [signup({ id: signupId })],
      }),
      userId,
    );

    expect(result.id).toBe(raidRunId);
    expect(updateWithSignups).toHaveBeenCalledWith(
      raidRunId,
      expect.not.objectContaining({ status: expect.anything() }),
      {
        toUpdate: [
          expect.objectContaining({
            id: signupId,
            characterName: '团长',
          }),
        ],
        toInsert: expect.arrayContaining([
          expect.objectContaining({
            createdBy: userId,
            role: 'pending',
          }),
        ]),
        toDeleteIds: [],
      },
    );
    expect(updateWithSignups.mock.calls[0]?.[2].toInsert).toHaveLength(24);
    expect(logger.info).toHaveBeenCalled();
  });

  it('inserts unknown ids and deletes missing current signups', async () => {
    await saveRaidRun(raidRunId, validBody(), userId);

    expect(updateWithSignups).toHaveBeenCalledWith(
      raidRunId,
      expect.objectContaining({ name: '周六团' }),
      {
        toUpdate: [],
        toInsert: expect.arrayContaining([
          expect.objectContaining({
            createdBy: userId,
            characterName: '团长',
          }),
        ]),
        toDeleteIds: [signupId],
      },
    );
    expect(updateWithSignups.mock.calls[0]?.[2].toInsert).toHaveLength(25);
  });

  it('rejects signup ids that belong to another raid run', async () => {
    findSignupsByIds.mockResolvedValue([
      { id: otherSignupId, raidRunId: 'other-run' },
    ]);

    try {
      await saveRaidRun(
        raidRunId,
        validBody({
          signups: [signup({ id: otherSignupId })],
        }),
        userId,
      );
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_SIGNUP_NOT_FOUND,
      );
      expect(updateWithSignups).not.toHaveBeenCalled();
    }
  });

  it('rejects duplicate incoming signup ids', async () => {
    try {
      await saveRaidRun(
        raidRunId,
        validBody({
          reservedTank: 2,
          signups: [
            signup({ id: signupId, positionNumber: 1 }),
            signup({
              id: signupId,
              positionNumber: 2,
              isLeader: false,
              isDarkRun: false,
              isFormationCore: false,
              characterName: '坦克',
            }),
          ],
        }),
        userId,
      );
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(ERROR_CODES.BAD_REQUEST);
    }
  });

  it('throws when the raid run is missing', async () => {
    findById.mockResolvedValue(null);

    try {
      await saveRaidRun(raidRunId, validBody(), userId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
  });

  it('throws when the update returns no row', async () => {
    updateWithSignups.mockResolvedValue(null);

    try {
      await saveRaidRun(raidRunId, validBody(), userId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    updateWithSignups.mockRejectedValue(failure);

    try {
      await saveRaidRun(raidRunId, validBody(), userId);
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });

  it('rejects an incomplete roster', async () => {
    try {
      await saveRaidRun(
        raidRunId,
        validBody({
          signups: [
            signup({
              isLeader: false,
            }),
          ],
        }),
        userId,
      );
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_LEADER_COUNT_INVALID,
      );
      expect(updateWithSignups).not.toHaveBeenCalled();
    }
  });
});

describe('updateRaidRunStatus', () => {
  beforeEach(() => {
    findById.mockReset();
    updateStatus.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    findById.mockResolvedValue({ id: raidRunId, status: 'pending' });
    updateStatus.mockResolvedValue({ status: 'recruiting' });
  });

  it('allows pending to recruiting', async () => {
    const result = await updateRaidRunStatus(raidRunId, {
      status: 'recruiting',
    });

    expect(result).toEqual({ status: 'recruiting' });
    expect(updateStatus).toHaveBeenCalledWith(
      raidRunId,
      'recruiting',
      undefined,
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('allows recruiting to ongoing and confirms signups', async () => {
    findById.mockResolvedValue({ id: raidRunId, status: 'recruiting' });
    updateStatus.mockResolvedValue({ status: 'ongoing' });

    const result = await updateRaidRunStatus(raidRunId, { status: 'ongoing' });

    expect(result).toEqual({ status: 'ongoing' });
    expect(updateStatus).toHaveBeenCalledWith(
      raidRunId,
      'ongoing',
      'confirmed',
    );
  });

  it('allows ongoing to completed', async () => {
    findById.mockResolvedValue({ id: raidRunId, status: 'ongoing' });
    updateStatus.mockResolvedValue({ status: 'completed' });

    const result = await updateRaidRunStatus(raidRunId, {
      status: 'completed',
    });

    expect(result).toEqual({ status: 'completed' });
    expect(updateStatus).toHaveBeenCalledWith(
      raidRunId,
      'completed',
      undefined,
    );
  });

  it('rejects an illegal transition', async () => {
    try {
      await updateRaidRunStatus(raidRunId, { status: 'ongoing' });
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_STATUS_TRANSITION_INVALID,
      );
      expect(updateStatus).not.toHaveBeenCalled();
    }
  });

  it('rejects transitions from completed', async () => {
    findById.mockResolvedValue({ id: raidRunId, status: 'completed' });

    try {
      await updateRaidRunStatus(raidRunId, { status: 'recruiting' });
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_STATUS_TRANSITION_INVALID,
      );
    }
  });

  it('rejects transitions from cancelled', async () => {
    findById.mockResolvedValue({ id: raidRunId, status: 'cancelled' });

    try {
      await updateRaidRunStatus(raidRunId, { status: 'pending' });
      throw new Error('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).code).toBe(
        ERROR_CODES.RAID_RUN_STATUS_TRANSITION_INVALID,
      );
    }
  });

  it('throws when the raid run is missing', async () => {
    findById.mockResolvedValue(null);

    try {
      await updateRaidRunStatus(raidRunId, { status: 'recruiting' });
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('throws when the update returns no row', async () => {
    updateStatus.mockResolvedValue(null);

    try {
      await updateRaidRunStatus(raidRunId, { status: 'recruiting' });
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    updateStatus.mockRejectedValue(failure);

    try {
      await updateRaidRunStatus(raidRunId, { status: 'recruiting' });
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

const listRow = (overrides: Partial<RaidRunListRow> = {}): RaidRunListRow => ({
  id: 'raid-run-1',
  name: '周六团',
  status: 'pending',
  gameRaidId: 'game-1',
  dungeonId,
  dungeonName: '河阳之战',
  dungeonPlayerLimit: 25,
  dungeonDifficulty: 'heroic',
  startTime,
  endTime,
  reservedTank: 1,
  reservedHealer: 2,
  reservedDps: 20,
  reservedBoss: 2,
  totalIncome: '15000',
  wagePerPerson: '1300.9',
  subsidyAmount: '2000',
  signupCount: 25,
  ...overrides,
});

describe('listAdminRaidRuns', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    formatDateTimeToMinute.mockClear();
    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
  });

  it('lists raid runs and maps rows', async () => {
    listPagination.mockResolvedValue([listRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminRaidRuns({
      page: 2,
      pageSize: 10,
      name: '周六',
      status: 'pending',
      dungeonId,
      startDate: '2026-08-22',
    });

    expect(buildWhereClause).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      name: '周六',
      status: 'pending',
      dungeonId,
      startDate: '2026-08-22',
    });

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'raid-run-1',
          name: '周六团',
          status: 'pending',
          gameRaidId: 'game-1',
          dungeonId,
          dungeonName: '25人英雄河阳之战',
          startTime: 'min:2026-08-22T13:00:00.000Z',
          endTime: 'min:2026-08-22T16:00:00.000Z',
          reservedTank: 1,
          reservedHealer: 2,
          reservedDps: 20,
          reservedBoss: 2,
          totalIncome: 15000,
          wagePerPerson: 1300,
          subsidyAmount: 2000,
          signupCount: 25,
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('defaults list total to 0 and maps nullable fields', async () => {
    listPagination.mockResolvedValue([
      listRow({
        gameRaidId: null,
        dungeonName: null,
        dungeonPlayerLimit: null,
        dungeonDifficulty: null,
        endTime: null,
        totalIncome: null,
        wagePerPerson: '',
        subsidyAmount: 'not-a-number',
      }),
    ]);
    count.mockResolvedValue([]);

    const result = await listAdminRaidRuns({ page: 1, pageSize: 20 });

    expect(result.total).toBe(0);
    expect(result.items[0]).toMatchObject({
      gameRaidId: null,
      dungeonName: null,
      endTime: null,
      totalIncome: 0,
      wagePerPerson: 0,
      subsidyAmount: 0,
    });
  });
});

describe('deleteAdminRaidRun', () => {
  beforeEach(() => {
    findById.mockReset();
    deleteWithChildren.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    findById.mockResolvedValue({ id: 'raid-run-1', status: 'pending' });
    deleteWithChildren.mockResolvedValue(undefined);
  });

  it('deletes a raid run and related rows', async () => {
    await deleteAdminRaidRun('raid-run-1');

    expect(deleteWithChildren).toHaveBeenCalledWith('raid-run-1');
    expect(logger.info).toHaveBeenCalled();
  });

  it('throws when the raid run is missing', async () => {
    findById.mockResolvedValue(null);

    await expect(deleteAdminRaidRun('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(deleteWithChildren).not.toHaveBeenCalled();
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    deleteWithChildren.mockRejectedValue(failure);

    try {
      await deleteAdminRaidRun('raid-run-1');
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

describe('copyRaidRun', () => {
  const copierId = 'copier-1';
  const copiedId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  beforeEach(() => {
    findDetailById.mockReset();
    createWithSignups.mockReset();
    shiftToTodayKeepingTime.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    shiftToTodayKeepingTime.mockImplementation((value: Date | null) => value);
    findDetailById.mockResolvedValue(
      detailRow({
        run: {
          ...defaultDetailRun,
          description: '周六开团',
          gameRaidId: 'game-1',
          remark: '原团备注',
          totalIncome: '15000',
          subsidyAmount: '2000',
          wagePerPerson: '1300',
        },
      }),
    );
    createWithSignups.mockResolvedValue({ id: copiedId });
  });

  it('copies a raid run and signups with reset fields', async () => {
    const result = await copyRaidRun(raidRunId, copierId);

    expect(result).toEqual({ id: copiedId });
    expect(shiftToTodayKeepingTime).toHaveBeenCalledWith(gatherTime);
    expect(shiftToTodayKeepingTime).toHaveBeenCalledWith(startTime);
    expect(shiftToTodayKeepingTime).toHaveBeenCalledWith(endTime);
    expect(createWithSignups).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '周六团',
        description: '周六开团',
        dungeonId,
        gameRaidId: null,
        createdBy: copierId,
        status: 'pending',
        gatherTime,
        startTime,
        endTime,
        reservedTank: 1,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
        remark: null,
        signups: [
          expect.objectContaining({
            groupNumber: 1,
            positionNumber: 1,
            role: 'tank',
            status: 'pending',
            isReserved: true,
            isLeader: true,
            isDarkRun: true,
            isFormationCore: true,
            characterName: '团长',
            userId: 'signup-user-1',
            createdBy: copierId,
            remark: null,
          }),
        ],
      }),
    );
    const payload = createWithSignups.mock.calls[0]?.[0] as {
      totalIncome?: string;
      wagePerPerson?: string;
      subsidyAmount?: string;
    };
    expect(payload.totalIncome).toBeUndefined();
    expect(payload.wagePerPerson).toBeUndefined();
    expect(payload.subsidyAmount).toBeUndefined();
    expect(logger.info).toHaveBeenCalled();
  });

  it('keeps null gather and end times', async () => {
    findDetailById.mockResolvedValue(
      detailRow({
        run: {
          ...defaultDetailRun,
          gatherTime: null,
          endTime: null,
        },
      }),
    );

    await copyRaidRun(raidRunId, copierId);

    expect(shiftToTodayKeepingTime).toHaveBeenCalledWith(null);
    expect(createWithSignups).toHaveBeenCalledWith(
      expect.objectContaining({
        gatherTime: null,
        endTime: null,
        startTime,
      }),
    );
  });

  it('throws when the raid run is missing', async () => {
    findDetailById.mockResolvedValue(null);

    try {
      await copyRaidRun(raidRunId, copierId);
      throw new Error('expected NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }
    expect(createWithSignups).not.toHaveBeenCalled();
  });

  it('logs and rethrows repository failures', async () => {
    const failure = new Error('db down');
    createWithSignups.mockRejectedValue(failure);

    try {
      await copyRaidRun(raidRunId, copierId);
      throw new Error('expected repository error');
    } catch (error) {
      expect(error).toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});
