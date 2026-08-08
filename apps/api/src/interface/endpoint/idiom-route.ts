import { createIdiom } from '@/application/service/idiom-service';
import {
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createIdiomBodySchema,
  createIdiomResponseSchema,
} from '../schema/idiom-schema';
import { apiRoute } from './api-route';

export const idiomTag = {
  name: 'idiom',
  description: '成语接口',
};

export const createIdiomRoute = apiRoute.group('/idiom', (app) =>
  app.post(
    '',
    async ({ body }) => {
      const { text, meaning } = body;
      const result = await createIdiom(text, meaning);
      return result;
    },
    {
      body: createIdiomBodySchema,
      response: {
        201: createSuccessResponseSchema(createIdiomResponseSchema),
        409: errorResponseSchema,
        500: errorResponseSchema,
      },
      tags: [idiomTag.name],
    },
  ),
);
