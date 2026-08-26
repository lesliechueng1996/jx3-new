import { format } from 'date-fns';

export const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
};

export const formatDateTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatDateTimeToMinute = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm');
};

export function shiftToTodayKeepingTime(value: Date, today?: Date): Date;
export function shiftToTodayKeepingTime(
  value: Date | null,
  today?: Date,
): Date | null;
export function shiftToTodayKeepingTime(
  value: Date | null,
  today = new Date(),
): Date | null {
  if (!value) {
    return null;
  }

  const shifted = new Date(value);
  shifted.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
  return shifted;
}
