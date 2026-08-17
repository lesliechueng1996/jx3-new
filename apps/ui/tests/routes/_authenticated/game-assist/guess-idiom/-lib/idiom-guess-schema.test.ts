import { describe, expect, it } from 'vitest';
import { DEFAULT_CELL_COLOR } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

describe('idiom-guess-schema', () => {
  it('defaults cell colors to black', () => {
    expect(DEFAULT_CELL_COLOR).toBe('black');
  });
});
