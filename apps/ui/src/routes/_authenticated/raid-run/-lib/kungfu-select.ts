import type { KungfuTypeColor } from '@/lib/kungfu-type-colors';

export type KungfuSelectOption = {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  kungfuType: KungfuTypeColor;
  icon: string | null;
  alias: readonly string[];
};

export const matchesKungfuQuery = (
  kungfu: KungfuSelectOption,
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (kungfu.name.toLowerCase().includes(normalized)) {
    return true;
  }

  if (kungfu.schoolName.toLowerCase().includes(normalized)) {
    return true;
  }

  return kungfu.alias.some((alias) => alias.toLowerCase().includes(normalized));
};

export const kungfuInputLabel = (
  value: string | undefined,
  kungfus: readonly KungfuSelectOption[],
): string => {
  if (!value) {
    return '';
  }
  return kungfus.find((kungfu) => kungfu.id === value)?.name ?? '';
};

export type ResolvedKungfuInput =
  | { action: 'select'; kungfu: KungfuSelectOption }
  | { action: 'clear' }
  | { action: 'revert' };

export const resolveKungfuInput = (
  input: string,
  kungfus: readonly KungfuSelectOption[],
): ResolvedKungfuInput => {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { action: 'clear' };
  }

  const matched =
    kungfus.find((kungfu) => kungfu.name === trimmed) ??
    kungfus.find((kungfu) => kungfu.alias.includes(trimmed));
  if (matched) {
    return { action: 'select', kungfu: matched };
  }

  return { action: 'revert' };
};
