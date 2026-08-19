import { describe, expect, it } from 'vitest';
import {
  canBanOrDeleteUser,
  providerLabel,
  userRoleBadgeClassName,
  userRoleLabel,
  userStatusBadgeClassName,
} from '@/routes/_authenticated/admin/users/-lib/users-helpers';

describe('canBanOrDeleteUser', () => {
  it('blocks the actor and other admins', () => {
    expect(
      canBanOrDeleteUser({ id: 'admin-1', role: 'admin' }, 'admin-1'),
    ).toBe(false);
    expect(
      canBanOrDeleteUser({ id: 'admin-2', role: 'admin' }, 'admin-1'),
    ).toBe(false);
    expect(canBanOrDeleteUser({ id: 'user-1', role: 'user' }, 'admin-1')).toBe(
      true,
    );
    expect(canBanOrDeleteUser({ id: 'user-2', role: null }, 'admin-1')).toBe(
      true,
    );
  });
});

describe('userRoleLabel', () => {
  it('maps known roles and a fallback', () => {
    expect(userRoleLabel('admin')).toBe('管理员');
    expect(userRoleLabel('user')).toBe('用户');
    expect(userRoleLabel(null)).toBe('未设置');
  });
});

describe('userRoleBadgeClassName', () => {
  it('maps known roles and a fallback', () => {
    expect(userRoleBadgeClassName('admin')).toContain('bg-violet-500');
    expect(userRoleBadgeClassName('user')).toContain('bg-sky-500');
    expect(userRoleBadgeClassName(null)).toContain('bg-zinc-400');
  });
});

describe('userStatusBadgeClassName', () => {
  it('maps banned and active states', () => {
    expect(userStatusBadgeClassName(true)).toContain('bg-red-500');
    expect(userStatusBadgeClassName(false)).toContain('bg-emerald-500');
  });
});

describe('providerLabel', () => {
  it('maps credential and leaves others unchanged', () => {
    expect(providerLabel('credential')).toBe('密码');
    expect(providerLabel('github')).toBe('github');
  });
});
