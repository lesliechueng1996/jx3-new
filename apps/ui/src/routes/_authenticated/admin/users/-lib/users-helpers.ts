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

export const providerLabel = (provider: string): string => {
  if (provider === 'credential') {
    return '密码';
  }
  return provider;
};
