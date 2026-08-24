import {
  createAdminGameServer,
  deleteAdminGameServer,
  getAdminGameServer,
  listAdminGameServers,
  listAllGameServers,
  syncAdminGameServersFromJx3box,
  updateAdminGameServer,
} from '@api/application/service/game-server-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createGameServerBodySchema,
  gameServerDetailSchema,
  gameServerIdParamsSchema,
  listAllGameServersResponseSchema,
  listGameServersResponseSchema,
  syncGameServersResponseSchema,
  updateGameServerBodySchema,
} from '../schema/game-server-schema';
import { apiRoute } from './api-route';

export const gameServerTag = {
  name: 'game-server',
  description: 'Game server API',
};

const gameServerDetailResponse = {
  200: createSuccessResponseSchema(gameServerDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const gameServerRoute = apiRoute.group('/game-server', (app) =>
  app
    .get(
      '/all',
      async ({ status }) => {
        const result = await listAllGameServers();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        response: {
          200: createSuccessResponseSchema(listAllGameServersResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'List all game servers',
          description:
            'Returns every game server id, zone, name, and alias. Requires user role.',
        },
      },
    )
    .post(
      '/sync',
      async ({ status }) => {
        const result = await syncAdminGameServersFromJx3box();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        response: {
          200: createSuccessResponseSchema(syncGameServersResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'Sync game servers from jx3box',
          description:
            'Fetches live servers and upserts them by name. Requires admin role.',
        },
      },
    )
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminGameServer(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createGameServerBodySchema,
        response: {
          201: createSuccessResponseSchema(gameServerDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'Create a game server',
          description: 'Creates a game server. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminGameServer(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameServerIdParamsSchema,
        response: gameServerDetailResponse,
        detail: {
          tags: [gameServerTag.name],
          summary: 'Get a game server',
          description: 'Returns a game server by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminGameServer(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameServerIdParamsSchema,
        body: updateGameServerBodySchema,
        response: {
          ...gameServerDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'Update a game server',
          description:
            'Updates game server id, zone, name, or alias. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminGameServer(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: gameServerIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'Delete a game server',
          description:
            'Deletes a game server that is not referenced. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ status }) => {
        const result = await listAdminGameServers();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        response: {
          200: createSuccessResponseSchema(listGameServersResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameServerTag.name],
          summary: 'List all game servers',
          description:
            'Returns every game server. Requires admin role. Not paginated.',
        },
      },
    ),
);
