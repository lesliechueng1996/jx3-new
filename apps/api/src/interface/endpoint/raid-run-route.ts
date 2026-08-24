import {
  createRaidRun,
  updateRaidRunGameRaidId,
  updateRaidRunWages,
} from '@api/application/service/raid-run-service';
import { roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createRaidRunBodySchema,
  createRaidRunResponseSchema,
  raidRunIdParamsSchema,
  updateRaidRunGameRaidIdBodySchema,
  updateRaidRunGameRaidIdResponseSchema,
  updateRaidRunWagesBodySchema,
  updateRaidRunWagesResponseSchema,
} from '../schema/raid-run-schema';
import { apiRoute } from './api-route';

export const raidRunTag = {
  name: 'raid-run',
  description: 'Raid Run API',
};

export const raidRunRoute = apiRoute.group('/raid-run', (app) =>
  app
    .post(
      '',
      async ({ body, status, user }) => {
        const raidRun = await createRaidRun(body, user.id);
        return status(
          201,
          AppResponse.success({
            id: raidRun.id,
          }).toJson(),
        );
      },
      {
        auth: roleUser,
        body: createRaidRunBodySchema,
        response: {
          201: createSuccessResponseSchema(createRaidRunResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Create a raid run',
          description: 'Creates a raid run. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/game-raid-id',
      async ({ body, params, status }) => {
        const result = await updateRaidRunGameRaidId(
          params.id,
          body.gameRaidId,
        );
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunGameRaidIdBodySchema,
        response: {
          200: createSuccessResponseSchema(
            updateRaidRunGameRaidIdResponseSchema,
          ),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update a raid run game raid id',
          description:
            'Updates the in-game raid id for a raid run. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/wages',
      async ({ body, params, status }) => {
        const result = await updateRaidRunWages(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunWagesBodySchema,
        response: {
          200: createSuccessResponseSchema(updateRaidRunWagesResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update raid run wages',
          description:
            'Updates total income, subsidy, and wage per person. Requires user role.',
        },
      },
    ),
);
