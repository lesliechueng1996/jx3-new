import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
  formatRaidLootWinnerDisplay,
  formatRaidLootWinnerLabel,
  matchesRaidLootWinnerQuery,
  parseLootQuantity,
  raidLootWinnerOptions,
  validateRaidLootForm,
} from '@/routes/_authenticated/raid-run/-lib/raid-loot';
import { createRaidSignup } from '@/routes/_authenticated/raid-run/-lib/raid-signup';

describe('parseLootQuantity', () => {
  it('parses positive integers and rejects invalid values', () => {
    expect(parseLootQuantity('1')).toBe(1);
    expect(parseLootQuantity('12')).toBe(12);
    expect(parseLootQuantity('')).toBeUndefined();
    expect(parseLootQuantity('0')).toBeUndefined();
    expect(parseLootQuantity('a')).toBeUndefined();
  });
});

describe('raid loot winner helpers', () => {
  it('formats labels and matches queries', () => {
    expect(
      formatRaidLootWinnerLabel({
        characterName: '团长',
        serverName: '破阵子',
      }),
    ).toBe('团长 · 破阵子');
    expect(formatRaidLootWinnerLabel({ characterName: '团长' })).toBe('团长');
    expect(formatRaidLootWinnerDisplay(null, '破阵子')).toBe('');
    expect(formatRaidLootWinnerDisplay('  ', '破阵子')).toBe('');
    expect(formatRaidLootWinnerDisplay('团长', '  ')).toBe('团长');
    expect(formatRaidLootWinnerDisplay(' 团长 ', '破阵子')).toBe(
      '团长 · 破阵子',
    );

    const option = { id: '1', characterName: '团长', serverName: '破阵子' };
    expect(matchesRaidLootWinnerQuery(option, '')).toBe(true);
    expect(matchesRaidLootWinnerQuery(option, '团')).toBe(true);
    expect(matchesRaidLootWinnerQuery(option, '破')).toBe(true);
    expect(matchesRaidLootWinnerQuery(option, '无')).toBe(false);
  });

  it('builds winner options from named signups', () => {
    const named = createRaidSignup({
      id: 's1',
      groupNumber: 1,
      positionNumber: 1,
      characterName: ' 团长 ',
      serverId: 'server-1',
    });
    const unnamed = createRaidSignup({
      id: 's2',
      groupNumber: 1,
      positionNumber: 2,
    });
    const noServer = createRaidSignup({
      id: 's3',
      groupNumber: 1,
      positionNumber: 3,
      characterName: '老板',
    });

    expect(
      raidLootWinnerOptions(
        [named, unnamed, noServer],
        [{ id: 'server-1', name: '破阵子' }],
      ),
    ).toEqual([
      { id: 's1', characterName: '团长', serverName: '破阵子' },
      { id: 's3', characterName: '老板', serverName: undefined },
    ]);
  });
});

describe('validateRaidLootForm', () => {
  it('requires an item or create name and a quantity', () => {
    expect(validateRaidLootForm({})).toBe('请选择物品');
    expect(validateRaidLootForm({ createName: '  ' })).toBe('请选择物品');
    expect(validateRaidLootForm({ itemId: 'item-1' })).toBe(
      '数量须为大于0的整数',
    );
    expect(
      validateRaidLootForm({ createName: '新物品', quantity: 1 }),
    ).toBeUndefined();
    expect(
      validateRaidLootForm({ itemId: 'item-1', quantity: 2 }),
    ).toBeUndefined();
  });
});

describe('quick create defaults', () => {
  it('uses equipment and purple', () => {
    expect(DEFAULT_QUICK_CREATE_ITEM_TYPE).toBe('equipment');
    expect(DEFAULT_QUICK_CREATE_ITEM_QUALITY).toBe('purple');
  });
});
