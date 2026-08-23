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

const validBody = (
  overrides: Partial<CreateRaidRunBody> = {},
): CreateRaidRunBody => ({
  name: '周六团',
  dungeonId,
  gatherTime,
  startTime,
  endTime,
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  signups: [signup()],
  ...overrides,
});

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
  },
}));

const { createRaidRun } = await import(
  '@api/application/service/raid-run-service'
);

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
        signups: [expect.objectContaining({ isReserved: false })],
      }),
    );
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
            isFormationCore: false,
            characterName: '治疗',
          }),
        ],
      }),
      ERROR_CODES.RAID_RUN_PLAYER_LIMIT_EXCEEDED,
      '超出副本人数限制',
    );
  });

  it('rejects a group number beyond the dungeon size', async () => {
    findDungeonById.mockResolvedValue(dungeonRow({ playerLimit: 5 }));

    await expectBadRequest(
      validBody({
        signups: [signup({ groupNumber: 2 })],
      }),
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
    await expectBadRequest(
      validBody({
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
      }),
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

  it('rejects a group without a formation core', async () => {
    await expectBadRequest(
      validBody({
        signups: [signup({ isFormationCore: false })],
      }),
      ERROR_CODES.RAID_RUN_FORMATION_CORE_INVALID,
      '阵眼人数不匹配，每个小队应只有1个阵眼',
    );
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
      '阵眼人数不匹配，每个小队应只有1个阵眼',
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
