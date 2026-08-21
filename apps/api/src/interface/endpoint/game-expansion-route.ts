import {
  createAdminGameExpansion,
  deleteAdminGameExpansion,
  getAdminGameExpansion,
  listAdminGameExpansions,
  updateAdminGameExpansion,
} from '@api/application/service/game-expansion-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createGameExpansionBodySchema,
  gameExpansionDetailSchema,
  gameExpansionIdParamsSchema,
  listGameExpansionsResponseSchema,
  updateGameExpansionBodySchema,
} from '../schema/game-expansion-schema';
import { apiRoute } from './api-route';

export const gameExpansionTag = {
  name: 'game-expansion',
  description: 'Game expansion API',
};

const gameExpansionDetailResponse = {
  200: createSuccessResponseSchema(gameExpansionDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const gameExpansionRoute = apiRoute.group('/game-expansion', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminGameExpansion(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createGameExpansionBodySchema,
        response: {
          201: createSuccessResponseSchema(gameExpansionDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameExpansionTag.name],
          summary: 'Create a game expansion',
          description: 'Creates a game expansion. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminGameExpansion(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameExpansionIdParamsSchema,
        response: gameExpansionDetailResponse,
        detail: {
          tags: [gameExpansionTag.name],
          summary: 'Get a game expansion',
          description: 'Returns a game expansion by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminGameExpansion(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameExpansionIdParamsSchema,
        body: updateGameExpansionBodySchema,
        response: {
          ...gameExpansionDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [gameExpansionTag.name],
          summary: 'Update a game expansion',
          description:
            'Updates expansion name, level, description, or dates. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminGameExpansion(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: gameExpansionIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameExpansionTag.name],
          summary: 'Delete a game expansion',
          description:
            'Deletes an expansion that has no seasons and is not referenced. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ status }) => {
        const result = await listAdminGameExpansions();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        response: {
          200: createSuccessResponseSchema(listGameExpansionsResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameExpansionTag.name],
          summary: 'List all game expansions',
          description:
            'Returns every game expansion. Requires admin role. Not paginated.',
        },
      },
    ),
);
