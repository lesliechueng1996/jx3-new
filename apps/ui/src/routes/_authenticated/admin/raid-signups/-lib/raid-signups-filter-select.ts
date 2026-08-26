export const EMPTY_FILTER_LABEL = '全部';

export type NamedFilterOption = {
  id: string;
  name: string;
  alias?: readonly string[];
};

export const formatGameServerFilterLabel = (server: {
  zone: string;
  name: string;
}): string => `${server.zone} · ${server.name}`;

export const matchesNamedFilterQuery = (
  item: NamedFilterOption,
  query: string,
  label: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (label.toLowerCase().includes(normalized)) {
    return true;
  }

  if (item.name.toLowerCase().includes(normalized)) {
    return true;
  }

  return (item.alias ?? []).some((alias) =>
    alias.toLowerCase().includes(normalized),
  );
};

export const namedFilterInputLabel = (
  value: string | undefined,
  items: readonly NamedFilterOption[],
  itemLabel: (item: NamedFilterOption) => string,
): string => {
  if (!value) {
    return EMPTY_FILTER_LABEL;
  }
  const selected = items.find((item) => item.id === value);
  return selected ? itemLabel(selected) : '';
};

export type ResolvedNamedFilterInput =
  | { action: 'select'; id: string }
  | { action: 'clear' }
  | { action: 'revert' };

export const resolveNamedFilterInput = (
  input: string,
  items: readonly NamedFilterOption[],
  itemLabel: (item: NamedFilterOption) => string,
): ResolvedNamedFilterInput => {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed === EMPTY_FILTER_LABEL) {
    return { action: 'clear' };
  }

  const matched =
    items.find((item) => itemLabel(item) === trimmed) ??
    items.find((item) => item.name === trimmed) ??
    items.find((item) => (item.alias ?? []).includes(trimmed));
  if (matched) {
    return { action: 'select', id: matched.id };
  }

  return { action: 'revert' };
};
