import { describe, expect, it } from 'vitest';
import { schoolFormSchema } from '@/routes/_authenticated/admin/schools/-lib/schools-form-schema';

describe('schoolFormSchema', () => {
  it('trims name and icon', () => {
    expect(
      schoolFormSchema.parse({
        name: ' 纯阳 ',
        type: 'school',
        icon: ' /icon.png ',
        aliasText: '纯阳宫',
      }),
    ).toEqual({
      name: '纯阳',
      type: 'school',
      icon: '/icon.png',
      aliasText: '纯阳宫',
    });
  });

  it('rejects a blank name', () => {
    const result = schoolFormSchema.safeParse({
      name: '  ',
      type: 'genre',
      icon: '',
      aliasText: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an overly long alias', () => {
    const result = schoolFormSchema.safeParse({
      name: '纯阳',
      type: 'school',
      icon: '',
      aliasText: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
