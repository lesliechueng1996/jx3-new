export const DEFAULT_EXPANSION_LEVEL = 130;

export const formatDateRange = (
  startDate: string,
  endDate: string | null,
): string => `${startDate} ~ ${endDate ?? '进行中'}`;

export const toOptionalText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const toOptionalDate = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};
