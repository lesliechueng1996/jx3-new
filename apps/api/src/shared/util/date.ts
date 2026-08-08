import { format } from 'date-fns';

export const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
};

export const formatDateTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};
