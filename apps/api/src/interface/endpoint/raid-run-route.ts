import {
  createRaidRun,
  getRaidRun,
  saveRaidRun,
  updateRaidRunGameRaidId,
  updateRaidRunStatus,
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
  raidRunDetailSchema,
  raidRunIdParamsSchema,
  updateRaidRunGameRaidIdBodySchema,
  updateRaidRunGameRaidIdResponseSchema,
  updateRaidRunStatusBodySchema,
  updateRaidRunStatusResponseSchema,
  updateRaidRunWagesBodySchema,
  updateRaidRunWagesResponseSchema,
} from '../schema/raid-run-schema';
import { apiRoute } from './api-route';

export const raidRunTag = {
  name: 'raid-run',
  description: 'Raid Run API',
};

const raidRunDetailResponse = {
  200: createSuccessResponseSchema(raidRunDetailSchema),
  400: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const raidRunRoute = apiRoute.group('/raid-run', (app) =>
  app
    .post(
      '',
      async ({ body, status, user }) => {
        const raidRun = await createRaidRun(body, user.id);
        const detail = await getRaidRun(raidRun.id);
        return status(201, AppResponse.success(detail).toJson());
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
    .get(
      '/:id',
      async ({ params, status }) => {
        const detail = await getRaidRun(params.id);
        return status(200, AppResponse.success(detail).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        response: raidRunDetailResponse,
        detail: {
          tags: [raidRunTag.name],
          summary: 'Get a raid run',
          description: 'Returns a raid run with signups. Requires user role.',
        },
      },
    )
    .put(
      '/:id',
      async ({ body, params, status, user }) => {
        const detail = await saveRaidRun(params.id, body, user.id);
        return status(200, AppResponse.success(detail).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: createRaidRunBodySchema,
        response: raidRunDetailResponse,
        detail: {
          tags: [raidRunTag.name],
          summary: 'Save a raid run',
          description:
            'Updates a raid run and syncs signups without changing status. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/status',
      async ({ body, params, status }) => {
        const result = await updateRaidRunStatus(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunStatusBodySchema,
        response: {
          200: createSuccessResponseSchema(updateRaidRunStatusResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update a raid run status',
          description:
            'Updates raid run status with allowed transitions. Requires user role.',
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
