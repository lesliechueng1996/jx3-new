import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTER_LABEL,
  formatGameServerFilterLabel,
  matchesNamedFilterQuery,
  namedFilterInputLabel,
  resolveNamedFilterInput,
} from '@/routes/_authenticated/admin/raid-signups/-lib/raid-signups-filter-select';

describe('formatGameServerFilterLabel', () => {
  it('joins zone and name', () => {
    expect(formatGameServerFilterLabel({ zone: '电信', name: '梦江南' })).toBe(
      '电信 · 梦江南',
    );
  });
});

describe('matchesNamedFilterQuery', () => {
  const server = {
    id: 'server-1',
    name: '梦江南',
    alias: ['双梦'],
  };

  it('matches an empty query', () => {
    expect(matchesNamedFilterQuery(server, '  ', '电信 · 梦江南')).toBe(true);
  });

  it('matches the formatted label', () => {
    expect(matchesNamedFilterQuery(server, '电信', '电信 · 梦江南')).toBe(true);
  });

  it('matches name case-insensitively', () => {
    expect(matchesNamedFilterQuery(server, '梦江', '其他标签')).toBe(true);
    expect(matchesNamedFilterQuery(server, '长安', '其他标签')).toBe(false);
  });

  it('matches alias and treats missing alias as empty', () => {
    expect(matchesNamedFilterQuery(server, '双梦', '其他标签')).toBe(true);
    expect(
      matchesNamedFilterQuery(
        { id: 'server-2', name: '长安' },
        '双梦',
        '其他标签',
      ),
    ).toBe(false);
  });
});

describe('namedFilterInputLabel', () => {
  const items = [{ id: 'server-1', name: '梦江南' }];
  const itemLabel = (item: { name: string }) => `电信 · ${item.name}`;

  it('uses the empty label when nothing is selected', () => {
    expect(namedFilterInputLabel(undefined, items, itemLabel)).toBe(
      EMPTY_FILTER_LABEL,
    );
  });

  it('resolves a selected item or falls back to empty text', () => {
    expect(namedFilterInputLabel('server-1', items, itemLabel)).toBe(
      '电信 · 梦江南',
    );
    expect(namedFilterInputLabel('missing', items, itemLabel)).toBe('');
  });
});

describe('resolveNamedFilterInput', () => {
  const items = [
    { id: 'server-1', name: '梦江南', alias: ['双梦'] },
    { id: 'server-2', name: '长安' },
  ];
  const itemLabel = (item: { id: string; name: string }) =>
    item.id === 'server-1' ? `电信 · ${item.name}` : `网通 · ${item.name}`;

  it('clears empty input and the empty label', () => {
    expect(resolveNamedFilterInput('  ', items, itemLabel)).toEqual({
      action: 'clear',
    });
    expect(
      resolveNamedFilterInput(EMPTY_FILTER_LABEL, items, itemLabel),
    ).toEqual({
      action: 'clear',
    });
  });

  it('selects by formatted label, name, or alias', () => {
    expect(resolveNamedFilterInput('电信 · 梦江南', items, itemLabel)).toEqual({
      action: 'select',
      id: 'server-1',
    });
    expect(resolveNamedFilterInput('长安', items, itemLabel)).toEqual({
      action: 'select',
      id: 'server-2',
    });
    expect(resolveNamedFilterInput('双梦', items, itemLabel)).toEqual({
      action: 'select',
      id: 'server-1',
    });
  });

  it('reverts unmatched input', () => {
    expect(resolveNamedFilterInput('不存在', items, itemLabel)).toEqual({
      action: 'revert',
    });
  });
});
