import { v4 as uuidv4 } from 'uuid';

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
  serverId: string,
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
