import type {
  AdminGameItemFormValues,
  ItemQuality,
  ItemType,
} from '@/lib/api/admin/admin-game-items-api';
import type { GameItemFormValues } from './game-items-form-schema';

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

export const parseAliasInput = (value: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of value.split(/[,，]/)) {
    const trimmed = part.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
};

export const formatAliasInput = (alias: string[]): string => alias.join('，');

export const toAdminGameItemFormValues = (
  values: GameItemFormValues,
): AdminGameItemFormValues => ({
  name: values.name,
  gameItemId: values.gameItemId ? values.gameItemId : null,
  type: values.type,
  quality: values.quality,
  description: values.description ? values.description : null,
  icon: values.icon ? values.icon : null,
  alias: parseAliasInput(values.aliasText),
});
