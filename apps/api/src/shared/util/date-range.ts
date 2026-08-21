export type DateRange = {
  startDate: string;
  endDate: string | null;
};

export const toDateOnly = (value: string | Date): string => {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

export const isOwnDateRangeValid = (
  startDate: string,
  endDate: string | null,
): boolean => {
  if (endDate === null) {
    return true;
  }

  return startDate <= endDate;
};

export const isDateWithinRange = (date: string, range: DateRange): boolean => {
  if (date < range.startDate) {
    return false;
  }

  if (range.endDate !== null && date > range.endDate) {
    return false;
  }

  return true;
};

export const isRangeWithinRange = (
  inner: DateRange,
  outer: DateRange,
): boolean => {
  if (!isOwnDateRangeValid(inner.startDate, inner.endDate)) {
    return false;
  }

  if (!isDateWithinRange(inner.startDate, outer)) {
    return false;
  }

  if (inner.endDate === null) {
    return outer.endDate === null;
  }

  return isDateWithinRange(inner.endDate, outer);
};
