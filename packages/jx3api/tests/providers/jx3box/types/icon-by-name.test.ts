import { describe, expect, it } from 'bun:test';
import { mapItemIcon } from '../../../../src/providers/jx3box/types/icon-by-name';

describe('mapItemIcon', () => {
  it('normalizes icon fields and builds the CDN URL', () => {
    expect(
      mapItemIcon({
        iconID: 13,
        Name: '五行石',
      }),
    ).toEqual({
      iconId: 13,
      name: '五行石',
      iconUrl: 'https://icon.jx3box.com/icon/13.png',
    });
  });
});
