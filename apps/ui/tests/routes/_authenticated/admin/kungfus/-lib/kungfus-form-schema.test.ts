import { describe, expect, it } from 'vitest';
import {
  emptyFormationEffects,
  joinFormationEffect,
  kungfuFormSchema,
  splitFormationEffect,
} from '@/routes/_authenticated/admin/kungfus/-lib/kungfus-form-schema';

const validForm = {
  name: '紫霞功',
  schoolId: 'school-1',
  kungfuType: 'attack' as const,
  attackType: 'internal' as const,
  attackMethod: 'ranged' as const,
  formationName: '紫霞',
  formationEffects: ['提高内功攻击', '提高会心', '', '', '', ''] as [
    string,
    string,
    string,
    string,
    string,
    string,
  ],
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icon.png',
  aliasText: '气纯',
};

describe('kungfuFormSchema', () => {
  it('trims name, icon, and formation name', () => {
    expect(
      kungfuFormSchema.parse({
        ...validForm,
        name: ' 紫霞功 ',
        icon: ' /icon.png ',
        formationName: ' 紫霞 ',
      }),
    ).toEqual({
      ...validForm,
      name: '紫霞功',
      icon: '/icon.png',
      formationName: '紫霞',
    });
  });

  it('rejects a blank name', () => {
    const result = kungfuFormSchema.safeParse({
      ...validForm,
      name: '  ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing school', () => {
    const result = kungfuFormSchema.safeParse({
      ...validForm,
      schoolId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an overly long alias', () => {
    const result = kungfuFormSchema.safeParse({
      ...validForm,
      aliasText: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects overly long formation effects', () => {
    const result = kungfuFormSchema.safeParse({
      ...validForm,
      formationEffects: ['x'.repeat(2001), '', '', '', '', ''],
    });
    expect(result.success).toBe(false);
  });
});

describe('splitFormationEffect', () => {
  it('splits lines into six levels', () => {
    expect(splitFormationEffect('一\n二\n三')).toEqual([
      '一',
      '二',
      '三',
      '',
      '',
      '',
    ]);
  });

  it('normalizes windows newlines and drops extra lines', () => {
    expect(
      splitFormationEffect('一\r\n二\r\n三\r\n四\r\n五\r\n六\r\n七'),
    ).toEqual(['一', '二', '三', '四', '五', '六']);
  });
});

describe('joinFormationEffect', () => {
  it('joins filled levels with newlines and trims trailing empties', () => {
    expect(joinFormationEffect([' 一 ', '二', '', '', '', ''])).toBe('一\n二');
    expect(joinFormationEffect(emptyFormationEffects())).toBe('');
    expect(joinFormationEffect(['', '', '三', '', '', ''])).toBe('\n\n三');
  });
});
