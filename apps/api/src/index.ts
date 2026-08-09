import { app } from './app';
import { initializeLogger, logger } from './infrastructure/logger';
import { createIdiomRoute } from './interface/endpoint/idiom-route';

await initializeLogger();

const server = app.use(createIdiomRoute);

export type App = typeof server;

server.listen(3001);

logger.info(
  `🦊 Elysia is running at ${server.server?.hostname}:${server.server?.port}`,
);
