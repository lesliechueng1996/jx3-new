import { describe, expect, it } from 'vitest';
import {
  isRaidSignupFlag,
  raidSignupFlagLabel,
  raidSignupFlagsFromItem,
  raidSignupRoleBadgeClassName,
  raidSignupRoleLabel,
  raidSignupStatusBadgeClassName,
  raidSignupStatusLabel,
} from '@/routes/_authenticated/admin/raid-signups/-lib/raid-signups-helpers';

describe('raidSignupRoleLabel', () => {
  it('maps every role', () => {
    expect(raidSignupRoleLabel('pending')).toBe('待定');
    expect(raidSignupRoleLabel('tank')).toBe('坦克');
    expect(raidSignupRoleLabel('healer')).toBe('治疗');
    expect(raidSignupRoleLabel('dps')).toBe('输出');
    expect(raidSignupRoleLabel('boss')).toBe('老板');
  });
});

describe('raidSignupRoleBadgeClassName', () => {
  it('maps every role', () => {
    expect(raidSignupRoleBadgeClassName('pending')).toContain('bg-slate-500');
    expect(raidSignupRoleBadgeClassName('tank')).toContain('bg-red-500');
    expect(raidSignupRoleBadgeClassName('healer')).toContain('bg-green-500');
    expect(raidSignupRoleBadgeClassName('dps')).toContain('bg-blue-500');
    expect(raidSignupRoleBadgeClassName('boss')).toContain('bg-amber-500');
  });
});

describe('raidSignupStatusLabel', () => {
  it('maps every status', () => {
    expect(raidSignupStatusLabel('pending')).toBe('待审核');
    expect(raidSignupStatusLabel('confirmed')).toBe('已确认');
    expect(raidSignupStatusLabel('waitlist')).toBe('候补');
    expect(raidSignupStatusLabel('rejected')).toBe('已拒绝');
  });
});

describe('raidSignupStatusBadgeClassName', () => {
  it('maps every status', () => {
    expect(raidSignupStatusBadgeClassName('pending')).toContain('bg-slate-500');
    expect(raidSignupStatusBadgeClassName('confirmed')).toContain(
      'bg-emerald-500',
    );
    expect(raidSignupStatusBadgeClassName('waitlist')).toContain(
      'bg-amber-500',
    );
    expect(raidSignupStatusBadgeClassName('rejected')).toContain('bg-red-500');
  });
});

describe('raidSignupFlagLabel', () => {
  it('maps every flag', () => {
    expect(raidSignupFlagLabel('leader')).toBe('团长');
    expect(raidSignupFlagLabel('darkRun')).toBe('黑本');
    expect(raidSignupFlagLabel('formationCore')).toBe('阵眼');
    expect(raidSignupFlagLabel('reserved')).toBe('预留');
  });
});

describe('isRaidSignupFlag', () => {
  it('accepts known flags and rejects others', () => {
    expect(isRaidSignupFlag('leader')).toBe(true);
    expect(isRaidSignupFlag('nope')).toBe(false);
  });
});

describe('raidSignupFlagsFromItem', () => {
  it('returns selected flags and an empty list when none are set', () => {
    expect(
      raidSignupFlagsFromItem({
        isLeader: true,
        isDarkRun: true,
        isFormationCore: true,
        isReserved: true,
      }),
    ).toEqual(['leader', 'darkRun', 'formationCore', 'reserved']);
    expect(
      raidSignupFlagsFromItem({
        isLeader: false,
        isDarkRun: false,
        isFormationCore: false,
        isReserved: false,
      }),
    ).toEqual([]);
  });
});
