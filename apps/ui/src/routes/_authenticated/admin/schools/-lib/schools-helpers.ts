import type { SchoolType } from '@/lib/api/admin/admin-schools-api';

export const schoolTypeLabel = (type: SchoolType): string =>
  type === 'genre' ? '流派' : '门派';

export const schoolTypeBadgeClassName = (type: SchoolType): string =>
  type === 'genre'
    ? 'border-transparent bg-cyan-500 text-white'
    : 'border-transparent bg-amber-500 text-white';

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
