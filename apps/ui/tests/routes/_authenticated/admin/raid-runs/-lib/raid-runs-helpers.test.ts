import { describe, expect, it } from 'vitest';
import {
  formatReservedSlots,
  raidRunStatusBadgeClassName,
  raidRunStatusLabel,
  weekdayFromStartTime,
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

describe('weekdayFromStartTime', () => {
  it('maps each weekday from an admin list start time', () => {
    expect(weekdayFromStartTime('2026-08-17 21:00')).toBe('周一');
    expect(weekdayFromStartTime('2026-08-18 21:00')).toBe('周二');
    expect(weekdayFromStartTime('2026-08-19 21:00')).toBe('周三');
    expect(weekdayFromStartTime('2026-08-20 21:00')).toBe('周四');
    expect(weekdayFromStartTime('2026-08-21 21:00')).toBe('周五');
    expect(weekdayFromStartTime('2026-08-22 21:00')).toBe('周六');
    expect(weekdayFromStartTime('2026-08-23 21:00')).toBe('周日');
  });
});
