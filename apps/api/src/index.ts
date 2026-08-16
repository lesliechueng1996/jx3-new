import { app } from './app';
import { initializeLogger, logger } from './infrastructure/logger';
import { idiomRoute } from './interface/endpoint/idiom-route';
import { userRoute } from './interface/endpoint/user-route';

await initializeLogger();

const server = app.use(idiomRoute).use(userRoute);

export type App = typeof server;

server.listen(3001);

logger.info(
  `🦊 Elysia is running at ${server.server?.hostname}:${server.server?.port}`,
);
