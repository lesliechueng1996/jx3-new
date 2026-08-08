import { errorResponseSchema } from '../schema/common';
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
  app.post('', async () => {}, {
    body: createIdiomBodySchema,
    response: {
      201: createIdiomResponseSchema,
      500: errorResponseSchema,
    },
    tags: [idiomTag.name],
  }),
);
