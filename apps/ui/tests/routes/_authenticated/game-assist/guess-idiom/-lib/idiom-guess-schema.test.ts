import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CELL_COLOR,
  type GuessRoundState,
  RECOMMENDED_GUESSES,
  resetRoundColors,
} from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

const coloredRound: GuessRoundState = {
  id: 'r1',
  text: '一心一意',
  inDatabase: true,
  cells: [
    {
      position: 0,
      char: '一',
      pinyin: 'yi1',
      initial: '',
      final: 'i',
      tone: 1,
      charColor: 'green',
      initialColor: 'orange',
      finalColor: 'green',
      toneColor: 'orange',
      syllableLink: 'green',
    },
  ],
};

describe('idiom-guess-schema', () => {
  it('defaults cell colors to black', () => {
    expect(DEFAULT_CELL_COLOR).toBe('black');
  });

  it('lists recommended opening guesses', () => {
    expect(RECOMMENDED_GUESSES).toEqual(['漏网之鱼', '卧薪尝胆']);
  });

  it('resets every color field on a round', () => {
    expect(resetRoundColors(coloredRound)).toEqual({
      ...coloredRound,
      cells: [
        {
          ...coloredRound.cells[0],
          charColor: DEFAULT_CELL_COLOR,
          initialColor: DEFAULT_CELL_COLOR,
          finalColor: DEFAULT_CELL_COLOR,
          toneColor: DEFAULT_CELL_COLOR,
          syllableLink: DEFAULT_CELL_COLOR,
        },
      ],
    });
  });
});
