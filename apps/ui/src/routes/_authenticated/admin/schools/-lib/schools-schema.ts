import { z } from 'zod';
import type { ListSchoolsFilters } from '@/lib/api/admin/admin-schools-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const schoolsSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  type: z.enum(['school', 'genre']).optional(),
});

export type SchoolsSearch = z.infer<typeof schoolsSearchSchema>;

export const defaultSchoolsSearch: SchoolsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  type: undefined,
};

export const toListSchoolsFilters = (
  search: SchoolsSearch,
): ListSchoolsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  type: search.type,
});
