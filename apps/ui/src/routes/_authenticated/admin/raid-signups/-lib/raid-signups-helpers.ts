import type {
  AdminRaidSignupListItem,
  RaidSignupFlag,
  RaidSignupRole,
  RaidSignupStatus,
} from '@/lib/api/admin/admin-raid-signups-api';
import { raidSignupFlagValues } from './raid-signups-schema';

export const raidSignupRoleLabel = (role: RaidSignupRole): string => {
  if (role === 'tank') {
    return '坦克';
  }
  if (role === 'healer') {
    return '治疗';
  }
  if (role === 'dps') {
    return '输出';
  }
  if (role === 'boss') {
    return '老板';
  }
  return '待定';
};

export const raidSignupRoleBadgeClassName = (role: RaidSignupRole): string => {
  if (role === 'tank') {
    return 'border-transparent bg-red-500 text-white';
  }
  if (role === 'healer') {
    return 'border-transparent bg-green-500 text-white';
  }
  if (role === 'dps') {
    return 'border-transparent bg-blue-500 text-white';
  }
  if (role === 'boss') {
    return 'border-transparent bg-amber-500 text-white';
  }
  return 'border-transparent bg-slate-500 text-white';
};

export const raidSignupStatusLabel = (status: RaidSignupStatus): string => {
  if (status === 'confirmed') {
    return '已确认';
  }
  if (status === 'waitlist') {
    return '候补';
  }
  if (status === 'rejected') {
    return '已拒绝';
  }
  return '待审核';
};

export const raidSignupStatusBadgeClassName = (
  status: RaidSignupStatus,
): string => {
  if (status === 'confirmed') {
    return 'border-transparent bg-emerald-500 text-white';
  }
  if (status === 'waitlist') {
    return 'border-transparent bg-amber-500 text-white';
  }
  if (status === 'rejected') {
    return 'border-transparent bg-red-500 text-white';
  }
  return 'border-transparent bg-slate-500 text-white';
};

export const raidSignupFlagLabel = (flag: RaidSignupFlag): string => {
  if (flag === 'leader') {
    return '团长';
  }
  if (flag === 'darkRun') {
    return '黑本';
  }
  if (flag === 'formationCore') {
    return '阵眼';
  }
  return '预留';
};

export const isRaidSignupFlag = (value: string): value is RaidSignupFlag =>
  (raidSignupFlagValues as readonly string[]).includes(value);

export const raidSignupFlagsFromItem = (
  item: Pick<
    AdminRaidSignupListItem,
    'isLeader' | 'isDarkRun' | 'isFormationCore' | 'isReserved'
  >,
): RaidSignupFlag[] => {
  const flags: RaidSignupFlag[] = [];
  if (item.isLeader) {
    flags.push('leader');
  }
  if (item.isDarkRun) {
    flags.push('darkRun');
  }
  if (item.isFormationCore) {
    flags.push('formationCore');
  }
  if (item.isReserved) {
    flags.push('reserved');
  }
  return flags;
};
