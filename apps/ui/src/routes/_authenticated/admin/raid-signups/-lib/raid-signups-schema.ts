import { z } from 'zod';
import type { ListRaidSignupsFilters } from '@/lib/api/admin/admin-raid-signups-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const raidSignupRoleValues = [
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
] as const;

export const raidSignupFlagValues = [
  'leader',
  'darkRun',
  'formationCore',
  'reserved',
] as const;

const raidSignupFlagSchema = z.enum(raidSignupFlagValues);

export const raidSignupsSearchSchema = paginationSearchQuerySchema.extend({
  characterName: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  raidRunName: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  serverId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  kungfuId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  role: z.enum(raidSignupRoleValues).optional(),
  flags: z
    .union([raidSignupFlagSchema, z.array(raidSignupFlagSchema)])
    .optional()
    .transform((val) => {
      if (val === undefined) {
        return undefined;
      }
      const list = [...new Set(Array.isArray(val) ? val : [val])];
      return list.length === 0 ? undefined : list;
    }),
});

export type RaidSignupsSearch = z.infer<typeof raidSignupsSearchSchema>;

export const defaultRaidSignupsSearch: RaidSignupsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  characterName: undefined,
  raidRunName: undefined,
  serverId: undefined,
  kungfuId: undefined,
  role: undefined,
  flags: undefined,
};

export const toListRaidSignupsFilters = (
  search: RaidSignupsSearch,
): ListRaidSignupsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  characterName: search.characterName,
  raidRunName: search.raidRunName,
  serverId: search.serverId,
  kungfuId: search.kungfuId,
  role: search.role,
  flags: search.flags,
});
