import {
  banAdminUser,
  changeCurrentUserPassword,
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  unbanAdminUser,
  updateAdminUser,
  uploadCurrentUserAvatar,
} from '@api/application/service/user-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import { applySetCookieHeaders } from '@api/shared/util/auth-cookies';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  adminUserDetailSchema,
  banUserBodySchema,
  changePasswordBodySchema,
  createUserBodySchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserBodySchema,
  uploadAvatarBodySchema,
  uploadAvatarResponseSchema,
  userIdParamsSchema,
} from '../schema/user-schema';
import { apiRoute } from './api-route';

export const userTag = {
  name: 'user',
  description: 'User API',
};

const adminUserDetailResponse = {
  200: createSuccessResponseSchema(adminUserDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const userRoute = apiRoute.group('/user', (app) =>
  app
    .post(
      '',
      async ({ body, request, status }) => {
        const result = await createAdminUser(body, request.headers);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createUserBodySchema,
        response: {
          201: createSuccessResponseSchema(adminUserDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [userTag.name],
          summary: 'Create a user',
          description:
            'Creates a user with email and password. Requires admin role.',
        },
      },
    )
    .post(
      '/avatar',
      async ({ body, request, set, status, user }) => {
        const { imageUrl, sessionCookies } = await uploadCurrentUserAvatar(
          user.id,
          body.file,
          request.headers,
        );
        applySetCookieHeaders(set, sessionCookies);
        return status(200, AppResponse.success({ imageUrl }).toJson());
      },
      {
        auth: roleUser,
        body: uploadAvatarBodySchema,
        response: {
          200: createSuccessResponseSchema(uploadAvatarResponseSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [userTag.name],
          summary: 'Upload current user avatar',
          description:
            'Uploads an avatar image for the signed-in user and stores a public URL on the user record.',
        },
      },
    )
    .post(
      '/password',
      async ({ body, request, status, user }) => {
        await changeCurrentUserPassword(user.id, body, request.headers);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleUser,
        body: changePasswordBodySchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [userTag.name],
          summary: 'Change current user password',
          description:
            'Changes the signed-in user password after verifying the current password.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminUser(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: userIdParamsSchema,
        response: adminUserDetailResponse,
        detail: {
          tags: [userTag.name],
          summary: 'Get a user',
          description: 'Returns a user by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, request, status, user }) => {
        const result = await updateAdminUser(
          params.id,
          body,
          user.id,
          request.headers,
        );
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: userIdParamsSchema,
        body: updateUserBodySchema,
        response: {
          ...adminUserDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [userTag.name],
          summary: 'Update a user',
          description:
            'Updates user name, email, role, or password. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, request, status, user }) => {
        await deleteAdminUser(params.id, user.id, request.headers);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: userIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [userTag.name],
          summary: 'Delete a user',
          description:
            'Deletes a user. Cannot delete yourself or another admin. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/ban',
      async ({ body, params, request, status, user }) => {
        const result = await banAdminUser(
          params.id,
          body,
          user.id,
          request.headers,
        );
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: userIdParamsSchema,
        body: banUserBodySchema,
        response: adminUserDetailResponse,
        detail: {
          tags: [userTag.name],
          summary: 'Ban a user',
          description:
            'Bans a user and revokes their sessions. Cannot ban yourself or another admin. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/unban',
      async ({ params, request, status }) => {
        const result = await unbanAdminUser(params.id, request.headers);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: userIdParamsSchema,
        response: adminUserDetailResponse,
        detail: {
          tags: [userTag.name],
          summary: 'Unban a user',
          description: 'Removes a user ban. Requires admin role.',
        },
      },
    )
    .get(
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
          description:
            'Returns a paginated list of users. Requires admin role.',
        },
      },
    ),
);
