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
