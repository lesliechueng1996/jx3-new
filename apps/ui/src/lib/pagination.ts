import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export const paginationSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
});

export type PaginationSearchQuery = z.infer<typeof paginationSearchQuerySchema>;
