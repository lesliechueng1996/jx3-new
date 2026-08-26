import type {
  AdminRaidRunListItem,
  RaidRunStatus,
} from '@/lib/api/admin/admin-raid-runs-api';

export const raidRunStatusLabel = (status: RaidRunStatus): string => {
  if (status === 'recruiting') {
    return '招募中';
  }
  if (status === 'ongoing') {
    return '进行中';
  }
  if (status === 'completed') {
    return '已完成';
  }
  if (status === 'cancelled') {
    return '已取消';
  }
  return '待开始';
};

export const raidRunStatusBadgeClassName = (status: RaidRunStatus): string => {
  if (status === 'recruiting') {
    return 'border-transparent bg-cyan-500 text-white';
  }
  if (status === 'ongoing') {
    return 'border-transparent bg-amber-500 text-white';
  }
  if (status === 'completed') {
    return 'border-transparent bg-emerald-500 text-white';
  }
  if (status === 'cancelled') {
    return 'border-transparent bg-red-500 text-white';
  }
  return 'border-transparent bg-slate-500 text-white';
};

export const formatReservedSlots = (
  raidRun: Pick<
    AdminRaidRunListItem,
    'reservedTank' | 'reservedHealer' | 'reservedDps' | 'reservedBoss'
  >,
): string | null => {
  if (
    raidRun.reservedTank === 0 &&
    raidRun.reservedHealer === 0 &&
    raidRun.reservedDps === 0 &&
    raidRun.reservedBoss === 0
  ) {
    return null;
  }

  return `T${raidRun.reservedTank} / H${raidRun.reservedHealer} / D${raidRun.reservedDps} / B${raidRun.reservedBoss}`;
};
