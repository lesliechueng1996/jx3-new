import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';

export const canBanOrDeleteUser = (
  target: { id: string; role: string | null },
  actorId: string,
): boolean => target.id !== actorId && target.role !== ROLE_ADMIN;

export const userRoleLabel = (role: string | null): string => {
  if (role === ROLE_ADMIN) {
    return '管理员';
  }
  if (role === ROLE_USER) {
    return '用户';
  }
  return '未设置';
};

export const userRoleBadgeClassName = (role: string | null): string => {
  if (role === ROLE_ADMIN) {
    return 'border-transparent bg-violet-500 text-white';
  }
  if (role === ROLE_USER) {
    return 'border-transparent bg-sky-500 text-white';
  }
  return 'border-transparent bg-zinc-400 text-white';
};

export const userStatusBadgeClassName = (banned: boolean): string =>
  banned
    ? 'border-transparent bg-red-500 text-white'
    : 'border-transparent bg-emerald-500 text-white';

export const providerLabel = (provider: string): string => {
  if (provider === 'credential') {
    return '密码';
  }
  return provider;
};
