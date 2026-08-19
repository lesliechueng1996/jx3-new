import type {
  AdminKungfuFormValues,
  AttackMethod,
  AttackType,
  KungfuType,
} from '@/lib/api/admin/admin-kungfus-api';
import { kungfuTypeBadgeClassName } from '@/lib/kungfu-type-colors';
import {
  joinFormationEffect,
  type KungfuFormValues,
} from './kungfus-form-schema';

export { kungfuTypeBadgeClassName };

export const kungfuTypeLabel = (type: KungfuType): string => {
  if (type === 'defense') {
    return '防御';
  }
  if (type === 'heal') {
    return '治疗';
  }
  return '攻击';
};

export const kungfuUnlimitedBadgeClassName =
  'border-transparent bg-fuchsia-500 text-white';

export const attackTypeLabel = (type: AttackType): string =>
  type === 'internal' ? '内功' : '外功';

export const attackMethodLabel = (method: AttackMethod): string =>
  method === 'melee' ? '近战' : '远程';

export const formatAttackSummary = (
  attackType: AttackType | null,
  attackMethod: AttackMethod | null,
): string | null => {
  const parts: string[] = [];
  if (attackType) {
    parts.push(attackTypeLabel(attackType));
  }
  if (attackMethod) {
    parts.push(attackMethodLabel(attackMethod));
  }
  return parts.length > 0 ? parts.join(' / ') : null;
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

export const toAdminKungfuFormValues = (
  values: KungfuFormValues,
): AdminKungfuFormValues => ({
  name: values.name,
  schoolId: values.schoolId,
  kungfuType: values.kungfuType,
  attackType: values.attackType === '' ? null : values.attackType,
  attackMethod: values.attackMethod === '' ? null : values.attackMethod,
  formationName: values.formationName ? values.formationName : null,
  formationEffect: joinFormationEffect(values.formationEffects) || null,
  isPveExternalRecommended: values.isPveExternalRecommended,
  isPveInternalRecommended: values.isPveInternalRecommended,
  isUnlimited: values.isUnlimited,
  icon: values.icon ? values.icon : null,
  alias: parseAliasInput(values.aliasText),
});
