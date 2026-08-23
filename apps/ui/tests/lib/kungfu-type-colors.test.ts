import { describe, expect, it } from 'vitest';
import {
  kungfuTypeBadgeClassName,
  kungfuTypeCellClassName,
  kungfuTypeTextClassName,
} from '@/lib/kungfu-type-colors';

describe('kungfuTypeBadgeClassName', () => {
  it('maps defense to red, attack to blue, and heal to green', () => {
    expect(kungfuTypeBadgeClassName('defense')).toContain('bg-red-500');
    expect(kungfuTypeBadgeClassName('attack')).toContain('bg-blue-500');
    expect(kungfuTypeBadgeClassName('heal')).toContain('bg-green-500');
  });
});

describe('kungfuTypeCellClassName', () => {
  it('maps defense to red, attack to blue, and heal to green', () => {
    expect(kungfuTypeCellClassName('defense')).toContain('bg-red-200');
    expect(kungfuTypeCellClassName('attack')).toContain('bg-blue-200');
    expect(kungfuTypeCellClassName('heal')).toContain('bg-green-200');
  });
});

describe('kungfuTypeTextClassName', () => {
  it('maps defense to red, attack to blue, and heal to green', () => {
    expect(kungfuTypeTextClassName('defense')).toContain('text-red-500');
    expect(kungfuTypeTextClassName('attack')).toContain('text-blue-500');
    expect(kungfuTypeTextClassName('heal')).toContain('text-green-500');
  });
});
