import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { env } from './infrastructure/config/env';
import { initializeLogger, logger } from './infrastructure/logger';
import { requestId } from './interface/plugins/request-id';
import { auth, OpenAPI } from './shared/util/auth';

await initializeLogger();

const app = new Elysia()
  .use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .use(
    openapi({
      path: '/swagger',
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(requestId())
  .mount(auth.handler)
  .listen(3001);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
