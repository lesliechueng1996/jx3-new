export const ITEM_TYPE_OPTIONS = [
  { value: 'equipment', label: '装备' },
  { value: 'special', label: '特殊' },
  { value: 'small_iron', label: '小铁' },
  { value: 'enchantment', label: '附魔' },
] as const;

export const ITEM_QUALITY_OPTIONS = [
  { value: 'white', label: '白' },
  { value: 'green', label: '绿' },
  { value: 'blue', label: '蓝' },
  { value: 'purple', label: '紫' },
  { value: 'orange', label: '橙' },
] as const;

export type ItemType = (typeof ITEM_TYPE_OPTIONS)[number]['value'];
export type ItemQuality = (typeof ITEM_QUALITY_OPTIONS)[number]['value'];

export const DEFAULT_QUICK_CREATE_ITEM_TYPE: ItemType = 'equipment';
export const DEFAULT_QUICK_CREATE_ITEM_QUALITY: ItemQuality = 'purple';

export const isItemType = (value: unknown): value is ItemType =>
  typeof value === 'string' &&
  ITEM_TYPE_OPTIONS.some((item) => item.value === value);

export const isItemQuality = (value: unknown): value is ItemQuality =>
  typeof value === 'string' &&
  ITEM_QUALITY_OPTIONS.some((item) => item.value === value);

export const itemTypeLabel = (type: ItemType): string => {
  const option = ITEM_TYPE_OPTIONS.find((item) => item.value === type);
  return option?.label ?? type;
};

export const itemTypeBadgeClassName = (type: ItemType): string => {
  if (type === 'equipment') {
    return 'border-transparent bg-slate-500 text-white';
  }
  if (type === 'special') {
    return 'border-transparent bg-amber-500 text-white';
  }
  if (type === 'small_iron') {
    return 'border-transparent bg-cyan-500 text-white';
  }
  return 'border-transparent bg-violet-500 text-white';
};

export const itemQualityLabel = (quality: ItemQuality): string => {
  const option = ITEM_QUALITY_OPTIONS.find((item) => item.value === quality);
  return option?.label ?? quality;
};

export const itemQualityBadgeClassName = (quality: ItemQuality): string => {
  if (quality === 'white') {
    return 'border-transparent bg-zinc-200 text-zinc-800';
  }
  if (quality === 'green') {
    return 'border-transparent bg-green-600 text-white';
  }
  if (quality === 'blue') {
    return 'border-transparent bg-blue-600 text-white';
  }
  if (quality === 'purple') {
    return 'border-transparent bg-purple-600 text-white';
  }
  return 'border-transparent bg-orange-500 text-white';
};
