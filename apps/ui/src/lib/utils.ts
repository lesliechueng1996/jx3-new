import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toRouteSearch<T extends Record<string, unknown>>(
  filters: T,
  defaults: T,
): { [K in keyof T]: T[K] | undefined } {
  const result = {} as { [K in keyof T]: T[K] | undefined };
  const keys = new Set([
    ...Object.keys(defaults),
    ...Object.keys(filters),
  ]) as Set<keyof T>;

  for (const key of keys) {
    const value = filters[key];
    const defaultValue = defaults[key];

    if (value === undefined || value === null || value === '') {
      result[key] = undefined;
      continue;
    }

    if (value === defaultValue) {
      result[key] = undefined;
      continue;
    }

    result[key] = value;
  }

  return result;
}
