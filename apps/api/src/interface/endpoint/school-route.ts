import {
  createAdminSchool,
  deleteAdminSchool,
  getAdminSchool,
  listAdminSchools,
  listAllSchools,
  updateAdminSchool,
} from '@api/application/service/school-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createSchoolBodySchema,
  listAllSchoolsResponseSchema,
  listSchoolsQuerySchema,
  listSchoolsResponseSchema,
  schoolDetailSchema,
  schoolIdParamsSchema,
  updateSchoolBodySchema,
} from '../schema/school-schema';
import { apiRoute } from './api-route';

export const schoolTag = {
  name: 'school',
  description: 'School API',
};

const schoolDetailResponse = {
  200: createSuccessResponseSchema(schoolDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const schoolRoute = apiRoute.group('/school', (app) =>
  app
    .get(
      '/all',
      async ({ status }) => {
        const result = await listAllSchools();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        response: {
          200: createSuccessResponseSchema(listAllSchoolsResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [schoolTag.name],
          summary: 'List all schools',
          description:
            'Returns every school id, name, type, icon, and alias. Requires user role.',
        },
      },
    )
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminSchool(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createSchoolBodySchema,
        response: {
          201: createSuccessResponseSchema(schoolDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [schoolTag.name],
          summary: 'Create a school',
          description: 'Creates a game school or genre. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminSchool(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: schoolIdParamsSchema,
        response: schoolDetailResponse,
        detail: {
          tags: [schoolTag.name],
          summary: 'Get a school',
          description: 'Returns a school by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminSchool(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: schoolIdParamsSchema,
        body: updateSchoolBodySchema,
        response: {
          ...schoolDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [schoolTag.name],
          summary: 'Update a school',
          description:
            'Updates school name, type, icon, or alias. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminSchool(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: schoolIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [schoolTag.name],
          summary: 'Delete a school',
          description:
            'Deletes a school that is not referenced. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminSchools(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listSchoolsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listSchoolsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [schoolTag.name],
          summary: 'List schools with pagination and filters',
          description:
            'Returns a paginated list of schools. Requires admin role.',
        },
      },
    ),
);
