import { describe, expect, it } from 'bun:test';
import {
  buildItemIconUrl,
  JX3BOX_ICON_CDN_BASE_URL,
  JX3BOX_NODE_BASE_URL,
  JX3BOX_SPIDER_BASE_URL,
} from '../../../src/providers/jx3box/config';

describe('jx3box config', () => {
  it('exposes the upstream base URLs', () => {
    expect(JX3BOX_SPIDER_BASE_URL).toBe(
      'https://spider2.jx3box.com/api/spider',
    );
    expect(JX3BOX_NODE_BASE_URL).toBe('https://node.jx3box.com');
    expect(JX3BOX_ICON_CDN_BASE_URL).toBe('https://icon.jx3box.com/icon');
  });

  it('builds a PNG URL from an icon id', () => {
    expect(buildItemIconUrl(1234)).toBe(
      'https://icon.jx3box.com/icon/1234.png',
    );
  });
});
