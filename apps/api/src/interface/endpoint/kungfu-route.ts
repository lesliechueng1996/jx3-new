import {
  createAdminKungfu,
  deleteAdminKungfu,
  getAdminKungfu,
  listAdminKungfus,
  updateAdminKungfu,
} from '@api/application/service/kungfu-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createKungfuBodySchema,
  kungfuDetailSchema,
  kungfuIdParamsSchema,
  listKungfusQuerySchema,
  listKungfusResponseSchema,
  updateKungfuBodySchema,
} from '../schema/kungfu-schema';
import { apiRoute } from './api-route';

export const kungfuTag = {
  name: 'kungfu',
  description: 'Kungfu API',
};

const kungfuDetailResponse = {
  200: createSuccessResponseSchema(kungfuDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const kungfuRoute = apiRoute.group('/kungfu', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminKungfu(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createKungfuBodySchema,
        response: {
          201: createSuccessResponseSchema(kungfuDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [kungfuTag.name],
          summary: 'Create a kungfu',
          description: 'Creates a game kungfu. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminKungfu(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: kungfuIdParamsSchema,
        response: kungfuDetailResponse,
        detail: {
          tags: [kungfuTag.name],
          summary: 'Get a kungfu',
          description: 'Returns a kungfu by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminKungfu(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: kungfuIdParamsSchema,
        body: updateKungfuBodySchema,
        response: {
          ...kungfuDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [kungfuTag.name],
          summary: 'Update a kungfu',
          description: 'Updates kungfu fields. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminKungfu(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: kungfuIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [kungfuTag.name],
          summary: 'Delete a kungfu',
          description:
            'Deletes a kungfu that is not referenced. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminKungfus(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listKungfusQuerySchema,
        response: {
          200: createSuccessResponseSchema(listKungfusResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [kungfuTag.name],
          summary: 'List kungfus with pagination and filters',
          description:
            'Returns a paginated list of kungfus. Requires admin role.',
        },
      },
    ),
);
