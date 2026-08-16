import { listAdminUsers } from '@api/application/service/user-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  listUsersQuerySchema,
  listUsersResponseSchema,
} from '../schema/user-schema';
import { apiRoute } from './api-route';

export const userTag = {
  name: 'user',
  description: 'User API',
};

export const userRoute = apiRoute.group('/user', (app) =>
  app.get(
    '',
    async ({ query, status }) => {
      const result = await listAdminUsers(query);
      return status(200, AppResponse.success(result).toJson());
    },
    {
      auth: roleAdmin,
      query: listUsersQuerySchema,
      response: {
        200: createSuccessResponseSchema(listUsersResponseSchema),
        400: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: [userTag.name],
        summary: 'List users with pagination and filters',
        description: 'Returns a paginated list of users. Requires admin role.',
      },
    },
  ),
);
