import { v4 as uuidv4 } from 'uuid';
import { createRaidSignup, type RaidSignup } from './raid-signup';

export const raidRunStatusMapping = {
  pending: '待开始',
  recruiting: '招募中',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export type RaidRunStatus = keyof typeof raidRunStatusMapping;

const defaultRaidRunStatus: RaidRunStatus = 'pending';

export const RAID_RUN_TOTAL_GROUP_COUNT = 5;
export const RAID_RUN_POSITION_COUNT_PER_GROUP = 5;

export type RaidDungeon = {
  id: string;
  name: string;
  playerLimit: number;
  bossCount: number;
  difficulty: 'normal' | 'heroic' | 'challenge';
};

const raidDungeonDifficultyLabel = {
  normal: '普通',
  heroic: '英雄',
  challenge: '挑战',
} as const;

export const formatRaidDungeonLabel = (dungeon: RaidDungeon) =>
  `${dungeon.name}（${raidDungeonDifficultyLabel[dungeon.difficulty]} · ${dungeon.playerLimit}人）`;

export type RaidRunProps = {
  id?: string;
  name?: string;
  description?: string;
  status?: RaidRunStatus;
  gatherTime?: Date;
  startTime?: Date;
  endTime?: Date;
  reservedTank?: number;
  reservedHealer?: number;
  reservedDps?: number;
  reservedBoss?: number;
  remark?: string;
  totalIncome?: number;
  wagePerPerson?: number;
  subsidyAmount?: number;
  gameRaidId?: string;
  dungeonInput?: string;
  dungeon?: RaidDungeon;
};

export type RaidRun = {
  id: string;
  name?: string;
  description?: string;
  status: RaidRunStatus;
  gatherTime: Date;
  startTime: Date;
  endTime: Date;
  reservedTank: number;
  reservedHealer: number;
  reservedDps: number;
  reservedBoss: number;
  remark?: string;
  totalIncome: number;
  wagePerPerson: number;
  subsidyAmount: number;
  gameRaidId?: string;
  dungeonInput?: string;
  dungeon?: RaidDungeon;
  totalGroupCount: number;
  positionCountPerGroup: number;
  signups: RaidSignup[][];
};

const createEmptySignups = (): RaidSignup[][] =>
  Array.from({ length: RAID_RUN_TOTAL_GROUP_COUNT }, (_, groupIndex) =>
    Array.from(
      { length: RAID_RUN_POSITION_COUNT_PER_GROUP },
      (_, positionIndex) =>
        createRaidSignup({
          groupNumber: groupIndex + 1,
          positionNumber: positionIndex + 1,
        }),
    ),
  );

export const createRaidRun = (props: RaidRunProps = {}): RaidRun => ({
  id: props.id ?? uuidv4(),
  name: props.name,
  description: props.description,
  status: props.status ?? defaultRaidRunStatus,
  gatherTime: props.gatherTime ?? new Date(),
  startTime: props.startTime ?? new Date(),
  endTime: props.endTime ?? new Date(),
  reservedTank: props.reservedTank ?? 0,
  reservedHealer: props.reservedHealer ?? 0,
  reservedDps: props.reservedDps ?? 0,
  reservedBoss: props.reservedBoss ?? 0,
  remark: props.remark,
  totalIncome: props.totalIncome ?? 0,
  wagePerPerson: props.wagePerPerson ?? 0,
  subsidyAmount: props.subsidyAmount ?? 0,
  gameRaidId: props.gameRaidId,
  dungeonInput: props.dungeonInput,
  dungeon: props.dungeon,
  totalGroupCount: RAID_RUN_TOTAL_GROUP_COUNT,
  positionCountPerGroup: RAID_RUN_POSITION_COUNT_PER_GROUP,
  signups: createEmptySignups(),
});

export const setRaidRunName = (run: RaidRun, name: string): RaidRun => ({
  ...run,
  name,
});

export const setRaidRunDescription = (
  run: RaidRun,
  description: string,
): RaidRun => ({
  ...run,
  description,
});

export const setRaidRunStatus = (
  run: RaidRun,
  status: RaidRunStatus,
): RaidRun => ({
  ...run,
  status,
});

export const setRaidRunDungeonInput = (
  run: RaidRun,
  dungeonInput: string,
): RaidRun => ({
  ...run,
  dungeonInput,
});

export const setRaidRunDungeon = (
  run: RaidRun,
  dungeon: RaidDungeon,
): RaidRun => ({
  ...run,
  dungeon,
});

export const setRaidRunReservedTank = (
  run: RaidRun,
  reservedTank: number,
): RaidRun => ({
  ...run,
  reservedTank,
});

export const setRaidRunReservedHealer = (
  run: RaidRun,
  reservedHealer: number,
): RaidRun => ({
  ...run,
  reservedHealer,
});

export const setRaidRunReservedDps = (
  run: RaidRun,
  reservedDps: number,
): RaidRun => ({
  ...run,
  reservedDps,
});

export const setRaidRunReservedBoss = (
  run: RaidRun,
  reservedBoss: number,
): RaidRun => ({
  ...run,
  reservedBoss,
});

export const setRaidRunRemark = (run: RaidRun, remark: string): RaidRun => ({
  ...run,
  remark,
});

export const setRaidRunTotalIncome = (
  run: RaidRun,
  totalIncome: number,
): RaidRun => ({
  ...run,
  totalIncome,
});

export const setRaidRunWagePerPerson = (
  run: RaidRun,
  wagePerPerson: number,
): RaidRun => ({
  ...run,
  wagePerPerson,
});

export const setRaidRunSubsidyAmount = (
  run: RaidRun,
  subsidyAmount: number,
): RaidRun => ({
  ...run,
  subsidyAmount,
});

export const setRaidRunGameRaidId = (
  run: RaidRun,
  gameRaidId: string,
): RaidRun => ({
  ...run,
  gameRaidId,
});

export const setRaidRunGatherTime = (
  run: RaidRun,
  gatherTime: Date,
): RaidRun => ({
  ...run,
  gatherTime,
});

export const setRaidRunStartTime = (
  run: RaidRun,
  startTime: Date,
): RaidRun => ({
  ...run,
  startTime,
});

export const setRaidRunEndTime = (run: RaidRun, endTime: Date): RaidRun => ({
  ...run,
  endTime,
});

export const updateRaidSignupAt = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
  updater: (signup: RaidSignup) => RaidSignup,
): RaidRun => ({
  ...run,
  signups: run.signups.map((group, groupIndex) =>
    groupIndex !== groupNumber - 1
      ? group
      : group.map((signup, positionIndex) =>
          positionIndex !== positionNumber - 1 ? signup : updater(signup),
        ),
  ),
});
