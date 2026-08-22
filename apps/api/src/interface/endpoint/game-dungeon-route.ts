import {
  createAdminGameDungeon,
  deleteAdminGameDungeon,
  getAdminGameDungeon,
  listAdminGameDungeons,
  updateAdminGameDungeon,
} from '@api/application/service/game-dungeon-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createGameDungeonBodySchema,
  gameDungeonDetailSchema,
  gameDungeonIdParamsSchema,
  listGameDungeonsQuerySchema,
  listGameDungeonsResponseSchema,
  updateGameDungeonBodySchema,
} from '../schema/game-dungeon-schema';
import { apiRoute } from './api-route';

export const gameDungeonTag = {
  name: 'game-dungeon',
  description: 'Game dungeon API',
};

const gameDungeonDetailResponse = {
  200: createSuccessResponseSchema(gameDungeonDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const gameDungeonRoute = apiRoute.group('/game-dungeon', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminGameDungeon(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createGameDungeonBodySchema,
        response: {
          201: createSuccessResponseSchema(gameDungeonDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameDungeonTag.name],
          summary: 'Create a game dungeon',
          description: 'Creates a game dungeon. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminGameDungeon(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameDungeonIdParamsSchema,
        response: gameDungeonDetailResponse,
        detail: {
          tags: [gameDungeonTag.name],
          summary: 'Get a game dungeon',
          description: 'Returns a game dungeon by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminGameDungeon(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameDungeonIdParamsSchema,
        body: updateGameDungeonBodySchema,
        response: {
          ...gameDungeonDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [gameDungeonTag.name],
          summary: 'Update a game dungeon',
          description: 'Updates dungeon fields. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminGameDungeon(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: gameDungeonIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameDungeonTag.name],
          summary: 'Delete a game dungeon',
          description:
            'Deletes a dungeon that is not referenced by raid runs. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminGameDungeons(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listGameDungeonsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listGameDungeonsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameDungeonTag.name],
          summary: 'List dungeons with pagination and filters',
          description:
            'Returns a paginated list of dungeons. Requires admin role.',
        },
      },
    ),
);
