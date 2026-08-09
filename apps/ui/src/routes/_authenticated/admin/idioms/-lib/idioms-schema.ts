import { z } from 'zod';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const idiomsSearchSchema = paginationSearchQuerySchema.extend({
  text: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
});

export type IdiomsSearch = z.infer<typeof idiomsSearchSchema>;

export const defaultIdiomsSearch: IdiomsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  text: undefined,
};
