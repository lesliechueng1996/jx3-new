export * from '@jx3/db';

export const isUniqueViolationError = (
  error: unknown,
  constraint?: string,
): boolean => {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; constraint?: string };
  if (e.code !== '23505') return false;
  if (constraint && e.constraint !== constraint) return false;
  return true;
};
