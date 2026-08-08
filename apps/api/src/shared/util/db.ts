export * from '@jx3/db';

export const isUniqueViolationError = (
  error: unknown,
  constraint?: string,
): boolean => {
  if (!error || typeof error !== 'object' || !('cause' in error)) {
    return false;
  }
  const cause = error.cause as { code?: string; constraint?: string };
  if (cause.code !== '23505') {
    return false;
  }
  if (constraint && cause.constraint !== constraint) {
    return false;
  }
  return true;
};
