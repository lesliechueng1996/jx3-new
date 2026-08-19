export const EMPTY_SCHOOL_LABEL = '全部';

export const matchesSchoolQuery = (
  school: { name: string; alias: readonly string[] },
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (school.name.toLowerCase().includes(normalized)) {
    return true;
  }

  return school.alias.some((alias) => alias.toLowerCase().includes(normalized));
};

export const schoolInputLabel = (
  value: string | undefined,
  schools: readonly { id: string; name: string }[],
  allowEmpty: boolean,
): string => {
  if (value) {
    return schools.find((school) => school.id === value)?.name ?? '';
  }
  return allowEmpty ? EMPTY_SCHOOL_LABEL : '';
};

export type ResolvedSchoolInput =
  | { action: 'select'; schoolId: string }
  | { action: 'clear' }
  | { action: 'revert' };

export const resolveSchoolInput = (
  input: string,
  schools: readonly { id: string; name: string; alias: readonly string[] }[],
  allowEmpty: boolean,
): ResolvedSchoolInput => {
  const trimmed = input.trim();
  if (trimmed.length === 0 || (allowEmpty && trimmed === EMPTY_SCHOOL_LABEL)) {
    return allowEmpty ? { action: 'clear' } : { action: 'revert' };
  }

  const matched =
    schools.find((school) => school.name === trimmed) ??
    schools.find((school) => school.alias.includes(trimmed));
  if (matched) {
    return { action: 'select', schoolId: matched.id };
  }

  return { action: 'revert' };
};
