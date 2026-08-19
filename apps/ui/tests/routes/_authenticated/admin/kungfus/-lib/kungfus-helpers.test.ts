import { describe, expect, it } from 'vitest';
import {
  attackMethodLabel,
  attackTypeLabel,
  formatAliasInput,
  formatAttackSummary,
  kungfuTypeBadgeClassName,
  kungfuTypeLabel,
  kungfuUnlimitedBadgeClassName,
  parseAliasInput,
  toAdminKungfuFormValues,
} from '@/routes/_authenticated/admin/kungfus/-lib/kungfus-helpers';

describe('kungfuTypeLabel', () => {
  it('maps kungfu types', () => {
    expect(kungfuTypeLabel('defense')).toBe('防御');
    expect(kungfuTypeLabel('heal')).toBe('治疗');
    expect(kungfuTypeLabel('attack')).toBe('攻击');
  });
});

describe('kungfuTypeBadgeClassName', () => {
  it('maps kungfu types', () => {
    expect(kungfuTypeBadgeClassName('defense')).toContain('bg-red-500');
    expect(kungfuTypeBadgeClassName('heal')).toContain('bg-green-500');
    expect(kungfuTypeBadgeClassName('attack')).toContain('bg-blue-500');
  });
});

describe('kungfuUnlimitedBadgeClassName', () => {
  it('uses a vivid fuchsia fill', () => {
    expect(kungfuUnlimitedBadgeClassName).toContain('bg-fuchsia-500');
  });
});

describe('attack labels', () => {
  it('maps attack type and method', () => {
    expect(attackTypeLabel('internal')).toBe('内功');
    expect(attackTypeLabel('external')).toBe('外功');
    expect(attackMethodLabel('melee')).toBe('近战');
    expect(attackMethodLabel('ranged')).toBe('远程');
  });
});

describe('formatAttackSummary', () => {
  it('joins present attack fields', () => {
    expect(formatAttackSummary('internal', 'ranged')).toBe('内功 / 远程');
    expect(formatAttackSummary('external', null)).toBe('外功');
    expect(formatAttackSummary(null, 'melee')).toBe('近战');
    expect(formatAttackSummary(null, null)).toBeNull();
  });
});

describe('parseAliasInput', () => {
  it('splits, trims, and de-duplicates aliases', () => {
    expect(parseAliasInput(' 气纯 , 气宗，气纯， ,紫霞')).toEqual([
      '气纯',
      '气宗',
      '紫霞',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseAliasInput('  , ， ')).toEqual([]);
  });
});

describe('formatAliasInput', () => {
  it('joins aliases with a Chinese comma', () => {
    expect(formatAliasInput(['气纯', '气宗'])).toBe('气纯，气宗');
    expect(formatAliasInput([])).toBe('');
  });
});

describe('toAdminKungfuFormValues', () => {
  it('converts empty optional fields to null', () => {
    expect(
      toAdminKungfuFormValues({
        name: '紫霞功',
        schoolId: 'school-1',
        kungfuType: 'attack',
        attackType: '',
        attackMethod: '',
        formationName: '',
        formationEffects: ['', '', '', '', '', ''],
        isPveExternalRecommended: false,
        isPveInternalRecommended: false,
        isUnlimited: true,
        icon: '',
        aliasText: '气纯，气宗',
      }),
    ).toEqual({
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: null,
      attackMethod: null,
      formationName: null,
      formationEffect: null,
      isPveExternalRecommended: false,
      isPveInternalRecommended: false,
      isUnlimited: true,
      icon: null,
      alias: ['气纯', '气宗'],
    });
  });

  it('keeps filled optional fields', () => {
    expect(
      toAdminKungfuFormValues({
        name: '紫霞功',
        schoolId: 'school-1',
        kungfuType: 'attack',
        attackType: 'internal',
        attackMethod: 'ranged',
        formationName: '紫霞',
        formationEffects: ['提高内功攻击', '提高会心', '', '', '', ''],
        isPveExternalRecommended: true,
        isPveInternalRecommended: false,
        isUnlimited: false,
        icon: '/icon.png',
        aliasText: '',
      }),
    ).toMatchObject({
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '紫霞',
      formationEffect: '提高内功攻击\n提高会心',
      icon: '/icon.png',
      alias: [],
    });
  });
});
