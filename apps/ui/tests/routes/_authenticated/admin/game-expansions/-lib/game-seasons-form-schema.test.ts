import { describe, expect, it } from 'vitest';
import { seasonFormSchema } from '@/routes/_authenticated/admin/game-expansions/-lib/game-seasons-form-schema';

const valid = {
  name: 'S1',
  description: '',
  startDate: '2024-06-01',
  endDate: '',
  sortOrder: '0',
};

describe('seasonFormSchema', () => {
  it('trims the name', () => {
    expect(
      seasonFormSchema.parse({
        ...valid,
        name: ' S1 ',
      }),
    ).toMatchObject({ name: 'S1', sortOrder: '0' });
  });

  it('rejects blank required fields', () => {
    const result = seasonFormSchema.safeParse({
      name: '  ',
      description: '',
      startDate: '',
      endDate: '',
      sortOrder: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer sort order', () => {
    expect(
      seasonFormSchema.safeParse({ ...valid, sortOrder: '1.5' }).success,
    ).toBe(false);
  });

  it('accepts a negative sort order', () => {
    expect(seasonFormSchema.parse({ ...valid, sortOrder: '-1' })).toMatchObject(
      { sortOrder: '-1' },
    );
  });

  it('rejects an invalid end date and start after end', () => {
    expect(
      seasonFormSchema.safeParse({ ...valid, endDate: '2024' }).success,
    ).toBe(false);
    expect(
      seasonFormSchema.safeParse({
        ...valid,
        startDate: '2024-06-01',
        endDate: '2024-01-01',
      }).success,
    ).toBe(false);
  });

  it('rejects an overly long name or description', () => {
    expect(
      seasonFormSchema.safeParse({ ...valid, name: 'x'.repeat(65) }).success,
    ).toBe(false);
    expect(
      seasonFormSchema.safeParse({
        ...valid,
        description: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});
