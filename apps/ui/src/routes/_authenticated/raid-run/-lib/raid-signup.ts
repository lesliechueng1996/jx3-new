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
