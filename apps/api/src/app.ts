import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { env } from './infrastructure/config/env';
import { idiomTag } from './interface/endpoint/idiom-route';
import { kungfuTag } from './interface/endpoint/kungfu-route';
import { schoolTag } from './interface/endpoint/school-route';
import { userTag } from './interface/endpoint/user-route';
import { httpLogger } from './interface/plugins/http-logger';
import { auth, OpenAPI } from './shared/util/auth';

export const app = new Elysia()
  .use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    }),
  )
  .use(
    openapi({
      path: '/swagger',
      documentation: {
        info: { title: '四堆 API', version: '1.0.0' },
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
        tags: [idiomTag, kungfuTag, schoolTag, userTag],
      },
    }),
  )
  .use(httpLogger)
  .mount(auth.handler);
