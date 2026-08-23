import { v4 as uuidv4 } from 'uuid';
import {
  type KungfuTypeColor,
  kungfuTypeCellClassName,
} from '@/lib/kungfu-type-colors';

export const raidSignupRoleMapping = {
  pending: '待定',
  tank: '坦克',
  healer: '治疗',
  dps: '输出',
  boss: '老板',
};

export type RaidSignupRole = keyof typeof raidSignupRoleMapping;

const defaultRaidSignupRole: RaidSignupRole = 'pending';

export type RaidSignupProps = {
  id?: string;
  groupNumber: number;
  positionNumber: number;
  role?: RaidSignupRole;
  isLeader?: boolean;
  isDarkRun?: boolean;
  isFormationCore?: boolean;
  serverId?: string;
  characterName?: string;
  schoolId?: string;
  kungfuId?: string;
  remark?: string;
};

export type RaidSignup = {
  id: string;
  groupNumber: number;
  positionNumber: number;
  role: RaidSignupRole;
  isLeader: boolean;
  isDarkRun: boolean;
  isFormationCore: boolean;
  serverId?: string;
  characterName?: string;
  schoolId?: string;
  kungfuId?: string;
  remark?: string;
};

export const createRaidSignup = (props: RaidSignupProps): RaidSignup => ({
  id: props.id ?? uuidv4(),
  groupNumber: props.groupNumber,
  positionNumber: props.positionNumber,
  role: props.role ?? defaultRaidSignupRole,
  isLeader: props.isLeader ?? false,
  isDarkRun: props.isDarkRun ?? false,
  isFormationCore: props.isFormationCore ?? false,
  serverId: props.serverId,
  characterName: props.characterName,
  schoolId: props.schoolId,
  kungfuId: props.kungfuId,
  remark: props.remark,
});

export const setRaidSignupRole = (
  signup: RaidSignup,
  role: RaidSignupRole,
): RaidSignup => ({
  ...signup,
  role,
});

export const setRaidSignupIsLeader = (
  signup: RaidSignup,
  isLeader: boolean,
): RaidSignup => ({
  ...signup,
  isLeader,
});

export const setRaidSignupIsDarkRun = (
  signup: RaidSignup,
  isDarkRun: boolean,
): RaidSignup => ({
  ...signup,
  isDarkRun,
});

export const setRaidSignupIsFormationCore = (
  signup: RaidSignup,
  isFormationCore: boolean,
): RaidSignup => ({
  ...signup,
  isFormationCore,
});

export const setRaidSignupServerId = (
  signup: RaidSignup,
  serverId: string | undefined,
): RaidSignup => ({
  ...signup,
  serverId,
});

export const setRaidSignupCharacterName = (
  signup: RaidSignup,
  characterName: string,
): RaidSignup => ({
  ...signup,
  characterName,
});

export const setRaidSignupSchoolId = (
  signup: RaidSignup,
  schoolId: string,
): RaidSignup => ({
  ...signup,
  schoolId,
});

export const setRaidSignupKungfuId = (
  signup: RaidSignup,
  kungfuId: string,
): RaidSignup => ({
  ...signup,
  kungfuId,
});

export type RaidSignupKungfuSelection = {
  id: string;
  schoolId: string;
  kungfuType: KungfuTypeColor;
};

export const kungfuTypeToRaidSignupRole = (
  kungfuType: KungfuTypeColor,
): RaidSignupRole => {
  if (kungfuType === 'defense') {
    return 'tank';
  }
  if (kungfuType === 'heal') {
    return 'healer';
  }
  return 'dps';
};

export const setRaidSignupKungfu = (
  signup: RaidSignup,
  kungfu: RaidSignupKungfuSelection | undefined,
): RaidSignup => {
  if (!kungfu) {
    return {
      ...signup,
      kungfuId: undefined,
      schoolId: undefined,
    };
  }

  return {
    ...signup,
    kungfuId: kungfu.id,
    schoolId: kungfu.schoolId,
    role: kungfuTypeToRaidSignupRole(kungfu.kungfuType),
  };
};

export type RaidSignupCharacterSearchSelection = {
  characterName: string;
  serverId?: string;
  kungfu?: RaidSignupKungfuSelection;
};

export const raidSignupCharacterSearchSelectionFromItem = (item: {
  characterName: string;
  serverId?: string | null;
  kungfuId?: string | null;
  schoolId?: string | null;
  kungfuType?: KungfuTypeColor | null;
}): RaidSignupCharacterSearchSelection => {
  const kungfuId = item.kungfuId ?? undefined;
  const schoolId = item.schoolId ?? undefined;
  const kungfuType = item.kungfuType ?? undefined;

  return {
    characterName: item.characterName,
    serverId: item.serverId ?? undefined,
    kungfu:
      kungfuId && schoolId && kungfuType
        ? {
            id: kungfuId,
            schoolId,
            kungfuType,
          }
        : undefined,
  };
};

export const applyRaidSignupFromCharacterSearch = (
  signup: RaidSignup,
  item: RaidSignupCharacterSearchSelection,
): RaidSignup => {
  let next = setRaidSignupCharacterName(signup, item.characterName);
  if (item.serverId) {
    next = setRaidSignupServerId(next, item.serverId);
  }
  if (item.kungfu) {
    next = setRaidSignupKungfu(next, item.kungfu);
  }
  return next;
};

export const formatRaidSignupCharacterSearchLabel = (item: {
  characterName: string;
  serverName?: string | null;
  kungfuName?: string | null;
}): string =>
  [item.characterName, item.serverName, item.kungfuName]
    .filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    )
    .join(' · ');

export const matchesRaidSignupCharacterQuery = (
  item: {
    characterName: string;
    serverName?: string | null;
    kungfuName?: string | null;
  },
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (item.characterName.toLowerCase().includes(normalized)) {
    return true;
  }
  if (item.serverName?.toLowerCase().includes(normalized)) {
    return true;
  }
  return Boolean(item.kungfuName?.toLowerCase().includes(normalized));
};

export const setRaidSignupRemark = (
  signup: RaidSignup,
  remark: string,
): RaidSignup => ({
  ...signup,
  remark,
});

export const resetRaidSignup = (signup: RaidSignup): RaidSignup => ({
  ...signup,
  role: defaultRaidSignupRole,
  isLeader: false,
  isDarkRun: false,
  isFormationCore: false,
  serverId: undefined,
  characterName: undefined,
  schoolId: undefined,
  kungfuId: undefined,
  remark: undefined,
});

export const RAID_SIGNUP_SLOT_DND_TYPE = 'raid-signup-slot';

export type RaidSignupSlotRef = {
  groupNumber: number;
  positionNumber: number;
};

export const raidSignupSlotId = (groupNumber: number, positionNumber: number) =>
  `${groupNumber}:${positionNumber}`;

const parseRaidSignupSlotId = (
  id: string | number | undefined,
): RaidSignupSlotRef | undefined => {
  if (typeof id !== 'string') {
    return undefined;
  }

  const separatorIndex = id.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === id.length - 1) {
    return undefined;
  }

  const groupNumber = Number(id.slice(0, separatorIndex));
  const positionNumber = Number(id.slice(separatorIndex + 1));
  if (
    !Number.isInteger(groupNumber) ||
    !Number.isInteger(positionNumber) ||
    groupNumber < 1 ||
    positionNumber < 1
  ) {
    return undefined;
  }

  return { groupNumber, positionNumber };
};

export const resolveRaidSignupSwapSlots = (
  sourceId: string | number | undefined,
  targetId: string | number | undefined,
): { source: RaidSignupSlotRef; target: RaidSignupSlotRef } | undefined => {
  const source = parseRaidSignupSlotId(sourceId);
  const target = parseRaidSignupSlotId(targetId);
  if (!source || !target) {
    return undefined;
  }

  if (
    source.groupNumber === target.groupNumber &&
    source.positionNumber === target.positionNumber
  ) {
    return undefined;
  }

  return { source, target };
};

export const swapRaidSignupAttributes = (
  source: RaidSignup,
  target: RaidSignup,
): [RaidSignup, RaidSignup] => [
  {
    ...target,
    id: source.id,
    groupNumber: source.groupNumber,
    positionNumber: source.positionNumber,
  },
  {
    ...source,
    id: target.id,
    groupNumber: target.groupNumber,
    positionNumber: target.positionNumber,
  },
];

export const raidSignupRoleItems = (
  Object.entries(raidSignupRoleMapping) as [RaidSignupRole, string][]
).map(([value, label]) => ({ value, label }));

export const formatRaidSignupSlotTitle = (
  groupNumber: number,
  positionNumber: number,
) => `第${groupNumber}队第${positionNumber}位`;

export const isRaidSignupSlotEmpty = (signup: RaidSignup) =>
  signup.role === defaultRaidSignupRole &&
  !signup.characterName &&
  !signup.kungfuId &&
  !signup.serverId;

const raidSignupRoleToKungfuType = (
  role: RaidSignupRole,
): KungfuTypeColor | undefined => {
  if (role === 'tank') {
    return 'defense';
  }
  if (role === 'healer') {
    return 'heal';
  }
  if (role === 'dps') {
    return 'attack';
  }
  return undefined;
};

export const raidSignupRoleCellClassName = (role: RaidSignupRole): string => {
  const kungfuType = raidSignupRoleToKungfuType(role);
  if (kungfuType) {
    return kungfuTypeCellClassName(kungfuType);
  }
  if (role === 'boss') {
    return 'border-transparent bg-amber-200 text-amber-900';
  }
  return 'bg-muted text-muted-foreground';
};
