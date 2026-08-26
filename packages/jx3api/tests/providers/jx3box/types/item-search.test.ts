import { describe, expect, it } from 'bun:test';
import { mapItemSearch } from '../../../../src/providers/jx3box/types/item-search';

describe('mapItemSearch', () => {
  it('normalizes fields, builds the icon URL, and joins description lines', () => {
    expect(
      mapItemSearch({
        id: '6_42729',
        Name: '睡起推篷',
        Level: 35300,
        IconID: 25571,
        MagicType: '130级武器用破防无双',
        attributes: [{ label: '武器伤害提高2737-4562' }, { label: '速度1.0' }],
      }),
    ).toEqual({
      id: '6_42729',
      level: 35300,
      iconId: 25571,
      iconUrl: 'https://icon.jx3box.com/icon/25571.png',
      description: '130级武器用破防无双\n武器伤害提高2737-4562\n速度1.0',
    });
  });

  it('omits a missing MagicType and empty attributes', () => {
    expect(
      mapItemSearch({
        id: '6_1',
        Name: '五行石',
        Level: 1,
        IconID: 13,
        MagicType: null,
        attributes: null,
      }),
    ).toEqual({
      id: '6_1',
      level: 1,
      iconId: 13,
      iconUrl: 'https://icon.jx3box.com/icon/13.png',
      description: '',
    });
  });
});
