import { z } from 'zod';
import type { ListRaidRunsFilters } from '@/lib/api/admin/admin-raid-runs-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const raidRunStatusValues = [
  'pending',
  'recruiting',
  'ongoing',
  'completed',
  'cancelled',
] as const;

export const raidRunsSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  status: z.enum(raidRunStatusValues).optional(),
  dungeonId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  startDate: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type RaidRunsSearch = z.infer<typeof raidRunsSearchSchema>;

export const defaultRaidRunsSearch: RaidRunsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  status: undefined,
  dungeonId: undefined,
  startDate: undefined,
};

export const toListRaidRunsFilters = (
  search: RaidRunsSearch,
): ListRaidRunsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  status: search.status,
  dungeonId: search.dungeonId,
  startDate: search.startDate,
});
