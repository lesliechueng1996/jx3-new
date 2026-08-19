import { describe, expect, it } from 'vitest';
import {
  canBanOrDeleteUser,
  providerLabel,
  userRoleLabel,
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

describe('providerLabel', () => {
  it('maps credential and leaves others unchanged', () => {
    expect(providerLabel('credential')).toBe('密码');
    expect(providerLabel('github')).toBe('github');
  });
});
