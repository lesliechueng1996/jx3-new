import { logger } from '@api/infrastructure/logger';
import { gameDungeonRepository } from '@api/infrastructure/repository/game-dungeon-repository';
import { gameServerRepository } from '@api/infrastructure/repository/game-server-repository';
import { kungfuRepository } from '@api/infrastructure/repository/kungfu-repository';
import { raidRunRepository } from '@api/infrastructure/repository/raid-run-repository';
import { schoolRepository } from '@api/infrastructure/repository/school-repository';
import type { CreateRaidRunBody } from '@api/interface/schema/raid-run-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

const uniqueIds = (ids: Array<string | undefined>): string[] => [
  ...new Set(ids.filter((id): id is string => id !== undefined)),
];

const countExistingByIds = async (
  ids: string[],
  countByIds: (ids: string[]) => Promise<number>,
): Promise<number> => {
  if (ids.length === 0) {
    return 0;
  }
  return countByIds(ids);
};

const validateCreateRaidRunBody = async (data: CreateRaidRunBody) => {
  if (data.gatherTime > data.startTime) {
    throw new BadRequestException(
      '集合时间不能大于进本时间',
      ERROR_CODES.RAID_RUN_TIME_INVALID,
    );
  }
  if (data.startTime > data.endTime) {
    throw new BadRequestException(
      '进本时间不能大于结束时间',
      ERROR_CODES.RAID_RUN_TIME_INVALID,
    );
  }

  const dungeon = await gameDungeonRepository.findById(data.dungeonId);
  if (!dungeon) {
    throw new NotFoundException(
      '相关副本不存在',
      ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
    );
  }

  if (dungeon.playerLimit < data.signups.length) {
    throw new BadRequestException(
      '超出副本人数限制',
      ERROR_CODES.RAID_RUN_PLAYER_LIMIT_EXCEEDED,
    );
  }

  const maxGroupNumber = Math.ceil(dungeon.playerLimit / 5);
  if (data.signups.some((signup) => signup.groupNumber > maxGroupNumber)) {
    throw new BadRequestException(
      '小队编号超出副本人数对应的小队数',
      ERROR_CODES.RAID_RUN_GROUP_NUMBER_INVALID,
    );
  }

  const tankCount = data.signups.filter(
    (signup) => signup.role === 'tank',
  ).length;
  const healerCount = data.signups.filter(
    (signup) => signup.role === 'healer',
  ).length;
  const dpsCount = data.signups.filter(
    (signup) => signup.role === 'dps',
  ).length;
  const bossCount = data.signups.filter(
    (signup) => signup.role === 'boss',
  ).length;

  if (tankCount !== data.reservedTank) {
    throw new BadRequestException(
      '坦克预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_TANK_MISMATCH,
    );
  }
  if (healerCount !== data.reservedHealer) {
    throw new BadRequestException(
      '治疗预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_HEALER_MISMATCH,
    );
  }
  if (dpsCount !== data.reservedDps) {
    throw new BadRequestException(
      'DPS预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_DPS_MISMATCH,
    );
  }
  if (bossCount !== data.reservedBoss) {
    throw new BadRequestException(
      '老板预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_BOSS_MISMATCH,
    );
  }

  const occupiedPositions = new Set<string>();
  for (const signup of data.signups) {
    const positionKey = `${signup.groupNumber}:${signup.positionNumber}`;
    if (occupiedPositions.has(positionKey)) {
      throw new BadRequestException(
        '小队位置重复',
        ERROR_CODES.RAID_RUN_DUPLICATE_POSITION,
      );
    }
    occupiedPositions.add(positionKey);
  }

  const inputServerIds = uniqueIds(
    data.signups.map((signup) => signup.serverId),
  );
  const inputSchoolIds = uniqueIds(
    data.signups.map((signup) => signup.schoolId),
  );
  const inputKungfuIds = uniqueIds(
    data.signups.map((signup) => signup.kungfuId),
  );

  const [serverCount, schoolCount, kungfuCount] = await Promise.all([
    countExistingByIds(inputServerIds, (ids) =>
      gameServerRepository.countByIds(ids),
    ),
    countExistingByIds(inputSchoolIds, (ids) =>
      schoolRepository.countByIds(ids),
    ),
    countExistingByIds(inputKungfuIds, (ids) =>
      kungfuRepository.countByIds(ids),
    ),
  ]);

  if (serverCount !== inputServerIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的服务器',
      ERROR_CODES.RAID_RUN_SERVER_NOT_FOUND,
    );
  }
  if (schoolCount !== inputSchoolIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的门派',
      ERROR_CODES.RAID_RUN_SCHOOL_NOT_FOUND,
    );
  }
  if (kungfuCount !== inputKungfuIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的心法',
      ERROR_CODES.RAID_RUN_KUNGFU_NOT_FOUND,
    );
  }

  if (inputKungfuIds.length > 0) {
    const kungfus = await kungfuRepository.findByIds(inputKungfuIds);
    const kungfuSchoolById = new Map(
      kungfus.map((kungfu) => [kungfu.id, kungfu.schoolId]),
    );

    for (const signup of data.signups) {
      if (!signup.kungfuId || !signup.schoolId) {
        continue;
      }
      if (kungfuSchoolById.get(signup.kungfuId) !== signup.schoolId) {
        throw new BadRequestException(
          '相关报名信息中存在心法与门派不匹配',
          ERROR_CODES.RAID_RUN_KUNGFU_SCHOOL_MISMATCH,
        );
      }
    }
  }

  const leaderCount = data.signups.filter((signup) => signup.isLeader).length;
  if (leaderCount !== 1) {
    throw new BadRequestException(
      '团长人数不匹配，应为1人',
      ERROR_CODES.RAID_RUN_LEADER_COUNT_INVALID,
    );
  }
  const darkRunCount = data.signups.filter((signup) => signup.isDarkRun).length;
  if (darkRunCount !== 1) {
    throw new BadRequestException(
      '黑本人数不匹配，应为1人',
      ERROR_CODES.RAID_RUN_DARK_RUN_COUNT_INVALID,
    );
  }

  const groupNumbers = [...new Set(data.signups.map((s) => s.groupNumber))];
  for (const groupNumber of groupNumbers) {
    const coreCount = data.signups.filter(
      (signup) => signup.groupNumber === groupNumber && signup.isFormationCore,
    ).length;
    if (coreCount !== 1) {
      throw new BadRequestException(
        '阵眼人数不匹配，每个小队应只有1个阵眼',
        ERROR_CODES.RAID_RUN_FORMATION_CORE_INVALID,
      );
    }
  }
};

export const createRaidRun = async (
  data: CreateRaidRunBody,
  userId: string,
) => {
  await validateCreateRaidRunBody(data);

  try {
    const raidRun = await raidRunRepository.createWithSignups({
      ...data,
      createdBy: userId,
      signups: data.signups.map((signup) => ({
        ...signup,
        createdBy: userId,
        isReserved: false,
      })),
    });

    logger.info(
      'Created raid run {raidRunId} for user {userId} with {signupCount} signups',
      {
        raidRunId: raidRun.id,
        userId,
        signupCount: data.signups.length,
      },
    );

    return raidRun;
  } catch (error) {
    logger.error('Create raid run failed, {userId}, {error}', {
      userId,
      error,
    });
    throw error;
  }
};
