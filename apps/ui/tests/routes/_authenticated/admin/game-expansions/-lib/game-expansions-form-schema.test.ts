import { describe, expect, it } from 'vitest';
import { expansionFormSchema } from '@/routes/_authenticated/admin/game-expansions/-lib/game-expansions-form-schema';

const valid = {
  name: '江湖',
  level: '130',
  description: '',
  startDate: '2024-01-01',
  endDate: '',
};

describe('expansionFormSchema', () => {
  it('trims the name', () => {
    expect(
      expansionFormSchema.parse({
        ...valid,
        name: ' 江湖 ',
      }),
    ).toMatchObject({ name: '江湖', level: '130' });
  });

  it('rejects blank required fields', () => {
    const result = expansionFormSchema.safeParse({
      name: '  ',
      level: '',
      description: '',
      startDate: '',
      endDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer or out-of-range level', () => {
    expect(
      expansionFormSchema.safeParse({ ...valid, level: '12.5' }).success,
    ).toBe(false);
    expect(
      expansionFormSchema.safeParse({ ...valid, level: '0' }).success,
    ).toBe(false);
    expect(
      expansionFormSchema.safeParse({ ...valid, level: '201' }).success,
    ).toBe(false);
  });

  it('rejects an invalid end date and start after end', () => {
    expect(
      expansionFormSchema.safeParse({ ...valid, endDate: '2024' }).success,
    ).toBe(false);
    expect(
      expansionFormSchema.safeParse({
        ...valid,
        startDate: '2024-06-01',
        endDate: '2024-01-01',
      }).success,
    ).toBe(false);
  });

  it('accepts a closed range', () => {
    expect(
      expansionFormSchema.parse({
        ...valid,
        endDate: '2024-12-31',
      }),
    ).toMatchObject({ endDate: '2024-12-31' });
  });

  it('rejects an overly long name or description', () => {
    expect(
      expansionFormSchema.safeParse({ ...valid, name: 'x'.repeat(65) }).success,
    ).toBe(false);
    expect(
      expansionFormSchema.safeParse({
        ...valid,
        description: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});
