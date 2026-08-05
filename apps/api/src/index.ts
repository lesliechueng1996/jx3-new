import { openapi } from '@elysia/openapi';
import { Elysia } from 'elysia';
import { auth, OpenAPI } from './shared/util/auth';

const app = new Elysia()
  .use(
    openapi({
      path: '/swagger',
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .mount(auth.handler)
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
