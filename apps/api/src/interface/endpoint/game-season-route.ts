import {
  createAdminGameSeason,
  deleteAdminGameSeason,
  getAdminGameSeason,
  listAdminGameSeasons,
  updateAdminGameSeason,
} from '@api/application/service/game-season-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createGameSeasonBodySchema,
  gameSeasonDetailSchema,
  gameSeasonIdParamsSchema,
  listGameSeasonsQuerySchema,
  listGameSeasonsResponseSchema,
  updateGameSeasonBodySchema,
} from '../schema/game-season-schema';
import { apiRoute } from './api-route';

export const gameSeasonTag = {
  name: 'game-season',
  description: 'Game season API',
};

const gameSeasonDetailResponse = {
  200: createSuccessResponseSchema(gameSeasonDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const gameSeasonRoute = apiRoute.group('/game-season', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminGameSeason(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createGameSeasonBodySchema,
        response: {
          201: createSuccessResponseSchema(gameSeasonDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameSeasonTag.name],
          summary: 'Create a game season',
          description:
            'Creates a season under an expansion. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminGameSeason(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameSeasonIdParamsSchema,
        response: gameSeasonDetailResponse,
        detail: {
          tags: [gameSeasonTag.name],
          summary: 'Get a game season',
          description: 'Returns a game season by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminGameSeason(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameSeasonIdParamsSchema,
        body: updateGameSeasonBodySchema,
        response: {
          ...gameSeasonDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [gameSeasonTag.name],
          summary: 'Update a game season',
          description:
            'Updates season name, description, dates, or sort order. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminGameSeason(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: gameSeasonIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameSeasonTag.name],
          summary: 'Delete a game season',
          description:
            'Deletes a season that is not referenced. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminGameSeasons(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listGameSeasonsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listGameSeasonsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameSeasonTag.name],
          summary: 'List seasons for an expansion',
          description:
            'Returns every season for an expansion. Requires admin role. Not paginated.',
        },
      },
    ),
);
