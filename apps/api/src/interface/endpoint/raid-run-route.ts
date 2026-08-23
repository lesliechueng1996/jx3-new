import { createRaidRun } from '@api/application/service/raid-run-service';
import { roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createRaidRunBodySchema,
  createRaidRunResponseSchema,
} from '../schema/raid-run-schema';
import { apiRoute } from './api-route';

export const raidRunTag = {
  name: 'raid-run',
  description: 'Raid Run API',
};

export const raidRunRoute = apiRoute.group('/raid-run', (app) =>
  app.post(
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
  ),
);
