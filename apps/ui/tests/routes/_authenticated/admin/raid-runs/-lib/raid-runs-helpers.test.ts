import { describe, expect, it } from 'vitest';
import {
  formatReservedSlots,
  raidRunStatusBadgeClassName,
  raidRunStatusLabel,
} from '@/routes/_authenticated/admin/raid-runs/-lib/raid-runs-helpers';

describe('raidRunStatusLabel', () => {
  it('maps every status', () => {
    expect(raidRunStatusLabel('pending')).toBe('待开始');
    expect(raidRunStatusLabel('recruiting')).toBe('招募中');
    expect(raidRunStatusLabel('ongoing')).toBe('进行中');
    expect(raidRunStatusLabel('completed')).toBe('已完成');
    expect(raidRunStatusLabel('cancelled')).toBe('已取消');
  });
});

describe('raidRunStatusBadgeClassName', () => {
  it('maps every status', () => {
    expect(raidRunStatusBadgeClassName('pending')).toContain('bg-slate-500');
    expect(raidRunStatusBadgeClassName('recruiting')).toContain('bg-cyan-500');
    expect(raidRunStatusBadgeClassName('ongoing')).toContain('bg-amber-500');
    expect(raidRunStatusBadgeClassName('completed')).toContain(
      'bg-emerald-500',
    );
    expect(raidRunStatusBadgeClassName('cancelled')).toContain('bg-red-500');
  });
});

describe('formatReservedSlots', () => {
  it('returns null when every reserved count is zero', () => {
    expect(
      formatReservedSlots({
        reservedTank: 0,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
      }),
    ).toBeNull();
  });

  it('formats reserved role counts', () => {
    expect(
      formatReservedSlots({
        reservedTank: 1,
        reservedHealer: 2,
        reservedDps: 20,
        reservedBoss: 2,
      }),
    ).toBe('T1 / H2 / D20 / B2');
  });
});
