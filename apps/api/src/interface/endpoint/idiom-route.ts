import {
  createIdiom,
  deleteIdiom,
  getIdiom,
  listIdiomsPagination,
} from '@/application/service/idiom-service';
import { roleAdmin } from '@/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createIdiomBodySchema,
  createIdiomResponseSchema,
  deleteIdiomParamsSchema,
  getIdiomParamsSchema,
  getIdiomResponseSchema,
  listIdiomsQuerySchema,
  listIdiomsResponseSchema,
} from '../schema/idiom-schema';
import { apiRoute } from './api-route';

export const idiomTag = {
  name: 'idiom',
  description: '成语接口',
};

export const createIdiomRoute = apiRoute.group('/idiom', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const { text, meaning } = body;
        const result = await createIdiom(text, meaning);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createIdiomBodySchema,
        response: {
          201: createSuccessResponseSchema(createIdiomResponseSchema),
          400: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Create an idiom',
          description:
            'Creates an idiom and derives pinyin from text via pinyin-pro. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const idiom = await getIdiom(params.id);
        return status(200, AppResponse.success(idiom).toJson());
      },
      {
        auth: roleAdmin,
        params: getIdiomParamsSchema,
        response: {
          200: createSuccessResponseSchema(getIdiomResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Get an idiom detail with characters',
          description:
            'Returns an idiom and its character phonetics. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteIdiom(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: deleteIdiomParamsSchema,
        response: {
          200: createSuccessResponseSchema(),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Delete an idiom',
          description:
            'Deletes an idiom and its character records. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listIdiomsPagination(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listIdiomsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listIdiomsResponseSchema),
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'List idioms with pagination and filters',
          description:
            'Returns a paginated list of idioms. Requires admin role.',
        },
      },
    ),
);
