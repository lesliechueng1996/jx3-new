import { z } from 'zod';
import type { ListKungfusFilters } from '@/lib/api/admin/admin-kungfus-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const kungfusSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  schoolId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  kungfuType: z.enum(['defense', 'heal', 'attack']).optional(),
  attackType: z.enum(['internal', 'external']).optional(),
  attackMethod: z.enum(['melee', 'ranged']).optional(),
  isUnlimited: z.enum(['true', 'false']).optional(),
});

export type KungfusSearch = z.infer<typeof kungfusSearchSchema>;

export const defaultKungfusSearch: KungfusSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  schoolId: undefined,
  kungfuType: undefined,
  attackType: undefined,
  attackMethod: undefined,
  isUnlimited: undefined,
};

export const toListKungfusFilters = (
  search: KungfusSearch,
): ListKungfusFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  schoolId: search.schoolId,
  kungfuType: search.kungfuType,
  attackType: search.attackType,
  attackMethod: search.attackMethod,
  isUnlimited:
    search.isUnlimited === 'true'
      ? true
      : search.isUnlimited === 'false'
        ? false
        : undefined,
});
