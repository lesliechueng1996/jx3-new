import { z } from 'zod';
import type { ListGameDungeonsFilters } from '@/lib/api/admin/admin-game-dungeons-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const gameDungeonsSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  expansionId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  seasonId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  difficulty: z.enum(['normal', 'heroic', 'challenge']).optional(),
});

export type GameDungeonsSearch = z.infer<typeof gameDungeonsSearchSchema>;

export const defaultGameDungeonsSearch: GameDungeonsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  expansionId: undefined,
  seasonId: undefined,
  difficulty: undefined,
};

export const toListGameDungeonsFilters = (
  search: GameDungeonsSearch,
): ListGameDungeonsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  expansionId: search.expansionId,
  seasonId: search.seasonId,
  difficulty: search.difficulty,
});
