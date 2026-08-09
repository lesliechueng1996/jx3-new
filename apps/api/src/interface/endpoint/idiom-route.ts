import {
  createIdiom,
  deleteIdiom,
  getIdiom,
  importIdiomsFromCsvFile,
  listIdiomsPagination,
  updateIdiom,
} from '@api/application/service/idiom-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createIdiomBodySchema,
  createIdiomResponseSchema,
  deleteIdiomParamsSchema,
  getIdiomResponseSchema,
  importIdiomsBodySchema,
  importIdiomsResponseSchema,
  listIdiomsQuerySchema,
  listIdiomsResponseSchema,
  singleIdiomParamsSchema,
  updateIdiomBodySchema,
  updateIdiomResponseSchema,
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
        params: singleIdiomParamsSchema,
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
          200: emptySuccessResponseSchema,
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
    )
    .patch(
      '/:id',
      async ({ status, body, params }) => {
        const result = await updateIdiom(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: singleIdiomParamsSchema,
        body: updateIdiomBodySchema,
        response: {
          200: createSuccessResponseSchema(updateIdiomResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Update idiom information',
          description:
            'Updates idiom and character records directly. Requires admin role.',
        },
      },
    )
    .post(
      '/import',
      async ({ body, status }) => {
        const result = await importIdiomsFromCsvFile(body.file);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: importIdiomsBodySchema,
        response: {
          200: createSuccessResponseSchema(importIdiomsResponseSchema),
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Import idioms from CSV file',
          description:
            'Imports idioms from a CSV file with a required text column. pinyin and meaning are optional; missing pinyin is derived via pinyin-pro. Requires admin role.',
        },
      },
    ),
);
