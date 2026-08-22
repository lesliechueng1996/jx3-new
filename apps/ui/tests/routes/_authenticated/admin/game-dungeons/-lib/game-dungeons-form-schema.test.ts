import { describe, expect, it } from 'vitest';
import { gameDungeonFormSchema } from '@/routes/_authenticated/admin/game-dungeons/-lib/game-dungeons-form-schema';

const validForm = {
  name: '河阳之战',
  expansionId: 'expansion-1',
  seasonId: 'season-1',
  playerLimit: '25',
  difficulty: 'heroic' as const,
  levelRequirement: '120',
  bossCount: '6',
  resetWeekdays: [1, 4],
};

describe('gameDungeonFormSchema', () => {
  it('trims name and integer fields', () => {
    expect(
      gameDungeonFormSchema.parse({
        ...validForm,
        name: ' 河阳之战 ',
        playerLimit: ' 25 ',
        levelRequirement: ' 120 ',
        bossCount: ' 6 ',
      }),
    ).toEqual({
      ...validForm,
      name: '河阳之战',
      playerLimit: '25',
      levelRequirement: '120',
      bossCount: '6',
    });
  });

  it('rejects empty required fields', () => {
    const result = gameDungeonFormSchema.safeParse({
      ...validForm,
      name: '',
      expansionId: '',
      seasonId: '',
      playerLimit: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer and out-of-range numbers', () => {
    expect(
      gameDungeonFormSchema.safeParse({
        ...validForm,
        playerLimit: '2.5',
      }).success,
    ).toBe(false);
    expect(
      gameDungeonFormSchema.safeParse({
        ...validForm,
        playerLimit: '0',
      }).success,
    ).toBe(false);
    expect(
      gameDungeonFormSchema.safeParse({
        ...validForm,
        levelRequirement: '201',
      }).success,
    ).toBe(false);
    expect(
      gameDungeonFormSchema.safeParse({
        ...validForm,
        bossCount: 'abc',
      }).success,
    ).toBe(false);
  });
});
