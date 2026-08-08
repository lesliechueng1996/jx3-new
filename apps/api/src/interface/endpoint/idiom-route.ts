import { createIdiom, getIdiom } from '@/application/service/idiom-service';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createIdiomBodySchema,
  createIdiomResponseSchema,
  getIdiomParamsSchema,
  getIdiomResponseSchema,
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
        auth: 'admin',
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
            'Creates an idiom and derives pinyin from text via pinyin-pro. Requires super_admin role.',
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
        auth: 'user',
        params: getIdiomParamsSchema,
        response: {
          200: createSuccessResponseSchema(getIdiomResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [idiomTag.name],
          summary: 'Get idiom detail with characters',
          description: 'Returns an idiom and its character phonetics.',
        },
      },
    ),
);
