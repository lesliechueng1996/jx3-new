import {
  listAdminRaidSignups,
  searchRaidSignups,
} from '@api/application/service/raid-signup-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  listRaidSignupsQuerySchema,
  listRaidSignupsResponseSchema,
  searchRaidSignupsQuerySchema,
  searchRaidSignupsResponseSchema,
} from '../schema/raid-signup-schema';
import { apiRoute } from './api-route';

export const raidSignupTag = {
  name: 'raid-signup',
  description: 'Raid Signup API',
};

export const raidSignupRoute = apiRoute.group('/raid-signup', (app) =>
  app
    .get(
      '/search',
      async ({ query, status }) => {
        const result = await searchRaidSignups(query.name);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        query: searchRaidSignupsQuerySchema,
        response: {
          200: createSuccessResponseSchema(searchRaidSignupsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidSignupTag.name],
          summary: 'Search raid signups by character name',
          description:
            'Returns up to 10 latest distinct character matches. Requires user role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminRaidSignups(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listRaidSignupsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listRaidSignupsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidSignupTag.name],
          summary: 'List raid signups with pagination and filters',
          description:
            'Returns a paginated list of raid signups with a character name. Requires admin role.',
        },
      },
    ),
);
