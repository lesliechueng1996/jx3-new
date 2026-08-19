import { z } from 'zod';
import type { ListUsersFilters } from '@/lib/api/admin/admin-users-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const usersSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  email: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  role: z.enum(['admin', 'user']).optional(),
  banned: z.enum(['true', 'false']).optional(),
});

export type UsersSearch = z.infer<typeof usersSearchSchema>;

export const defaultUsersSearch: UsersSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  email: undefined,
  role: undefined,
  banned: undefined,
};

export const toListUsersFilters = (search: UsersSearch): ListUsersFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  email: search.email,
  role: search.role,
  banned:
    search.banned === 'true'
      ? true
      : search.banned === 'false'
        ? false
        : undefined,
});
