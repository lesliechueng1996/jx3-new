import { describe, expect, it } from 'vitest';
import type { ItemQuality, ItemType } from '@/lib/game-item-labels';
import {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
  isItemQuality,
  isItemType,
  itemQualityBadgeClassName,
  itemQualityLabel,
  itemTypeBadgeClassName,
  itemTypeLabel,
} from '@/lib/game-item-labels';

describe('game-item-labels', () => {
  it('maps types and falls back', () => {
    expect(itemTypeLabel('equipment')).toBe('装备');
    expect(itemTypeLabel('unknown' as ItemType)).toBe('unknown');
    expect(itemTypeBadgeClassName('equipment')).toContain('bg-slate-500');
    expect(itemTypeBadgeClassName('special')).toContain('bg-amber-500');
    expect(itemTypeBadgeClassName('small_iron')).toContain('bg-cyan-500');
    expect(itemTypeBadgeClassName('enchantment')).toContain('bg-violet-500');
  });

  it('uses equipment and purple as quick-create defaults', () => {
    expect(DEFAULT_QUICK_CREATE_ITEM_TYPE).toBe('equipment');
    expect(DEFAULT_QUICK_CREATE_ITEM_QUALITY).toBe('purple');
  });

  it('narrows type and quality values', () => {
    expect(isItemType('equipment')).toBe(true);
    expect(isItemType('unknown')).toBe(false);
    expect(isItemType(1)).toBe(false);
    expect(isItemQuality('purple')).toBe(true);
    expect(isItemQuality('unknown')).toBe(false);
    expect(isItemQuality(1)).toBe(false);
  });

  it('maps qualities and falls back', () => {
    expect(itemQualityLabel('purple')).toBe('紫');
    expect(itemQualityLabel('unknown' as ItemQuality)).toBe('unknown');
    expect(itemQualityBadgeClassName('white')).toContain('bg-zinc-200');
    expect(itemQualityBadgeClassName('green')).toContain('bg-green-600');
    expect(itemQualityBadgeClassName('blue')).toContain('bg-blue-600');
    expect(itemQualityBadgeClassName('purple')).toContain('bg-purple-600');
    expect(itemQualityBadgeClassName('orange')).toContain('bg-orange-500');
  });
});
