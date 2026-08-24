import type {
  RaidRunDetail,
  RaidRunSaveBody,
  RaidRunSaveSignup,
} from '@/lib/api/raid-runs-api';
import {
  createRaidRun,
  formatRaidDungeonLabel,
  RAID_RUN_POSITION_COUNT_PER_GROUP,
  type RaidRun,
  updateRaidSignupAt,
} from './raid-run';
import { createRaidSignup, type RaidSignup } from './raid-signup';

export const flattenRaidSignups = (
  run: Pick<RaidRun, 'signups'>,
): RaidSignup[] => run.signups.flat();

export const raidSignupsForSave = (
  run: Pick<RaidRun, 'signups' | 'dungeon'>,
): RaidSignup[] => {
  const slots = flattenRaidSignups(run);
  const playerLimit = run.dungeon?.playerLimit ?? slots.length;
  return slots.slice(0, playerLimit);
};

const optionalText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export const toRaidRunSaveBody = (run: RaidRun): RaidRunSaveBody => {
  const dungeonId = run.dungeon?.id ?? '';
  const signups: RaidRunSaveSignup[] = raidSignupsForSave(run).map(
    (signup) => ({
      id: signup.id,
      groupNumber: signup.groupNumber,
      positionNumber: signup.positionNumber,
      role: signup.role,
      isLeader: signup.isLeader,
      isDarkRun: signup.isDarkRun,
      isFormationCore: signup.isFormationCore,
      serverId: signup.serverId,
      characterName: optionalText(signup.characterName),
      schoolId: signup.schoolId,
      kungfuId: signup.kungfuId,
      remark: optionalText(signup.remark),
    }),
  );

  return {
    name: run.name?.trim() ?? '',
    description: optionalText(run.description),
    dungeonId,
    gatherTime: run.gatherTime,
    startTime: run.startTime,
    endTime: run.endTime,
    reservedTank: run.reservedTank,
    reservedHealer: run.reservedHealer,
    reservedDps: run.reservedDps,
    reservedBoss: run.reservedBoss,
    remark: optionalText(run.remark),
    signups,
  };
};

type KungfuSchoolRef = {
  id: string;
  schoolId: string;
};

export const validateRaidRunForSave = (
  run: RaidRun,
  options: { kungfus?: readonly KungfuSchoolRef[] } = {},
): string | undefined => {
  const name = run.name?.trim() ?? '';
  if (name.length === 0 || name.length > 64) {
    return '团队名称不能为空,且不能超过64个字符';
  }

  if ((run.description?.length ?? 0) > 512) {
    return '描述最多 512 个字符';
  }

  if ((run.remark?.length ?? 0) > 512) {
    return '备注最多 512 个字符';
  }

  const dungeon = run.dungeon;
  if (!dungeon) {
    return '相关副本不存在';
  }

  if (run.gatherTime > run.startTime) {
    return '集合时间不能大于进本时间';
  }

  if (run.startTime > run.endTime) {
    return '进本时间不能大于结束时间';
  }

  const signups = raidSignupsForSave(run);
  if (signups.length !== dungeon.playerLimit) {
    return '报名人数须与副本人数上限一致';
  }

  const maxGroupNumber = Math.ceil(
    dungeon.playerLimit / RAID_RUN_POSITION_COUNT_PER_GROUP,
  );
  if (signups.some((signup) => signup.groupNumber > maxGroupNumber)) {
    return '小队编号超出副本人数对应的小队数';
  }

  const tankCount = signups.filter((signup) => signup.role === 'tank').length;
  const healerCount = signups.filter(
    (signup) => signup.role === 'healer',
  ).length;
  const dpsCount = signups.filter((signup) => signup.role === 'dps').length;
  const bossCount = signups.filter((signup) => signup.role === 'boss').length;

  if (tankCount !== run.reservedTank) {
    return '坦克预留人数不匹配';
  }
  if (healerCount !== run.reservedHealer) {
    return '治疗预留人数不匹配';
  }
  if (dpsCount !== run.reservedDps) {
    return 'DPS预留人数不匹配';
  }
  if (bossCount !== run.reservedBoss) {
    return '老板预留人数不匹配';
  }

  const occupiedPositions = new Set<string>();
  for (const signup of signups) {
    const positionKey = `${signup.groupNumber}:${signup.positionNumber}`;
    if (occupiedPositions.has(positionKey)) {
      return '小队位置重复';
    }
    occupiedPositions.add(positionKey);
  }

  const kungfus = options.kungfus ?? [];
  if (kungfus.length > 0) {
    const kungfuSchoolById = new Map(
      kungfus.map((kungfu) => [kungfu.id, kungfu.schoolId]),
    );
    for (const signup of signups) {
      if (!signup.kungfuId || !signup.schoolId) {
        continue;
      }
      if (kungfuSchoolById.get(signup.kungfuId) !== signup.schoolId) {
        return '相关报名信息中存在心法与门派不匹配';
      }
    }
  }

  if (signups.filter((signup) => signup.isLeader).length !== 1) {
    return '团长人数不匹配，应为1人';
  }

  if (signups.filter((signup) => signup.isDarkRun).length !== 1) {
    return '黑本人数不匹配，应为1人';
  }

  const groupNumbers = [
    ...new Set(signups.map((signup) => signup.groupNumber)),
  ];
  for (const groupNumber of groupNumbers) {
    const coreCount = signups.filter(
      (signup) => signup.groupNumber === groupNumber && signup.isFormationCore,
    ).length;
    if (coreCount > 1) {
      return '阵眼人数不匹配，每个小队最多1个阵眼';
    }
  }

  return undefined;
};

export const raidRunSaveSnapshot = (run: RaidRun): string =>
  JSON.stringify({
    name: run.name ?? '',
    description: run.description ?? '',
    dungeonId: run.dungeon?.id ?? '',
    gatherTime: run.gatherTime.getTime(),
    startTime: run.startTime.getTime(),
    endTime: run.endTime.getTime(),
    reservedTank: run.reservedTank,
    reservedHealer: run.reservedHealer,
    reservedDps: run.reservedDps,
    reservedBoss: run.reservedBoss,
    remark: run.remark ?? '',
    signups: flattenRaidSignups(run).map((signup) => ({
      id: signup.id,
      groupNumber: signup.groupNumber,
      positionNumber: signup.positionNumber,
      role: signup.role,
      isLeader: signup.isLeader,
      isDarkRun: signup.isDarkRun,
      isFormationCore: signup.isFormationCore,
      serverId: signup.serverId ?? '',
      characterName: signup.characterName ?? '',
      schoolId: signup.schoolId ?? '',
      kungfuId: signup.kungfuId ?? '',
      remark: signup.remark ?? '',
    })),
  });

const optionalDetailText = (value: string | null | undefined) =>
  value ?? undefined;

export const raidRunFromDetail = (detail: RaidRunDetail): RaidRun => {
  const dungeon = {
    id: detail.dungeon.id,
    name: detail.dungeon.name,
    playerLimit: detail.dungeon.playerLimit,
    bossCount: detail.dungeon.bossCount,
    difficulty: detail.dungeon.difficulty,
  };

  let run = createRaidRun({
    id: detail.id,
    name: detail.name,
    description: optionalDetailText(detail.description),
    status: detail.status,
    gatherTime: detail.gatherTime ? new Date(detail.gatherTime) : undefined,
    startTime: new Date(detail.startTime),
    endTime: detail.endTime ? new Date(detail.endTime) : undefined,
    reservedTank: detail.reservedTank,
    reservedHealer: detail.reservedHealer,
    reservedDps: detail.reservedDps,
    reservedBoss: detail.reservedBoss,
    remark: optionalDetailText(detail.remark),
    gameRaidId: optionalDetailText(detail.gameRaidId),
    totalIncome: detail.totalIncome,
    subsidyAmount: detail.subsidyAmount,
    wagePerPerson: detail.wagePerPerson,
    dungeon,
    dungeonInput: formatRaidDungeonLabel(dungeon),
  });

  for (const signup of detail.signups) {
    if (!signup.groupNumber || !signup.positionNumber) {
      continue;
    }

    run = updateRaidSignupAt(
      run,
      signup.groupNumber,
      signup.positionNumber,
      () =>
        createRaidSignup({
          id: signup.id,
          groupNumber: signup.groupNumber ?? 1,
          positionNumber: signup.positionNumber ?? 1,
          role: signup.role,
          isLeader: signup.isLeader,
          isDarkRun: signup.isDarkRun,
          isFormationCore: signup.isFormationCore,
          serverId: optionalDetailText(signup.serverId),
          characterName: optionalDetailText(signup.characterName),
          schoolId: optionalDetailText(signup.schoolId),
          kungfuId: optionalDetailText(signup.kungfuId),
          remark: optionalDetailText(signup.remark),
        }),
    );
  }

  return run;
};
