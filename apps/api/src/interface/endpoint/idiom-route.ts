import {
  createIdiom,
  deleteIdiom,
  getIdiom,
  getPinyin,
  importIdiomsFromCsvFile,
  listIdiomsPagination,
  searchIdioms,
  updateIdiom,
} from '@api/application/service/idiom-service';
import { ERROR_CODES } from '@api/shared/exception/error-code';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
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
  getPinyinQuerySchema,
  getPinyinResponseSchema,
  importIdiomsBodySchema,
  importIdiomsResponseSchema,
  listIdiomsQuerySchema,
  listIdiomsResponseSchema,
  searchIdiomsBodySchema,
  searchIdiomsResponseSchema,
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
    )
    .get(
      '/pinyin',
      async ({ query, status }) => {
        const regex = /^\p{Script=Han}{4}$/u;
        if (!regex.test(query.text)) {
          return status(
            400,
            AppResponse.error({
              code: ERROR_CODES.BAD_REQUEST,
              message: '参数应当为四个汉字',
            }).toJson(),
          );
        }
        const result = await getPinyin(query.text);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        query: getPinyinQuerySchema,
        response: {
          200: createSuccessResponseSchema(getPinyinResponseSchema),
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Get pinyin for a text',
          description: 'Returns pinyin for a text. Requires user role.',
        },
      },
    )
    .post(
      '/search',
      async ({ body, status }) => {
        const result = await searchIdioms(body.rounds, body.limit);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        body: searchIdiomsBodySchema,
        response: {
          200: createSuccessResponseSchema(searchIdiomsResponseSchema),
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Search idioms by rounds',
          description:
            'Search idioms based on the given rounds. Requires user role.',
        },
      },
    ),
);
