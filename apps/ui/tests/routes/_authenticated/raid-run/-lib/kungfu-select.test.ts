import { describe, expect, it } from 'vitest';
import {
  kungfuInputLabel,
  matchesKungfuQuery,
  resolveKungfuInput,
} from '@/routes/_authenticated/raid-run/-lib/kungfu-select';

const kungfu = {
  id: 'kungfu-1',
  name: '紫霞功',
  schoolId: 'school-1',
  schoolName: '纯阳',
  kungfuType: 'attack' as const,
  icon: '/icons/zixia.png',
  alias: ['气纯', 'Zi Xia'],
};

describe('matchesKungfuQuery', () => {
  it('matches an empty query', () => {
    expect(matchesKungfuQuery(kungfu, '  ')).toBe(true);
  });

  it('matches name, school, and alias', () => {
    expect(matchesKungfuQuery(kungfu, '紫霞')).toBe(true);
    expect(matchesKungfuQuery(kungfu, '纯阳')).toBe(true);
    expect(matchesKungfuQuery(kungfu, 'zi xia')).toBe(true);
    expect(matchesKungfuQuery(kungfu, '气纯')).toBe(true);
    expect(matchesKungfuQuery(kungfu, '冰心')).toBe(false);
  });
});

describe('kungfuInputLabel', () => {
  it('resolves a selected kungfu name', () => {
    expect(kungfuInputLabel('kungfu-1', [kungfu])).toBe('紫霞功');
    expect(kungfuInputLabel('missing', [kungfu])).toBe('');
    expect(kungfuInputLabel(undefined, [kungfu])).toBe('');
  });
});

describe('resolveKungfuInput', () => {
  const kungfus = [
    kungfu,
    {
      id: 'kungfu-2',
      name: '冰心诀',
      schoolId: 'school-2',
      schoolName: '七秀',
      kungfuType: 'heal' as const,
      icon: null,
      alias: [],
    },
  ];

  it('clears empty input', () => {
    expect(resolveKungfuInput('  ', kungfus)).toEqual({ action: 'clear' });
  });

  it('selects an exact name or alias', () => {
    expect(resolveKungfuInput('冰心诀', kungfus)).toEqual({
      action: 'select',
      kungfu: kungfus[1],
    });
    expect(resolveKungfuInput('气纯', kungfus)).toEqual({
      action: 'select',
      kungfu,
    });
  });

  it('reverts unmatched input', () => {
    expect(resolveKungfuInput('少林', kungfus)).toEqual({ action: 'revert' });
  });
});
