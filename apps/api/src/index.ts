import { app } from './app';
import { initializeLogger, logger } from './infrastructure/logger';
import { gameServerRoute } from './interface/endpoint/game-server-route';
import { idiomRoute } from './interface/endpoint/idiom-route';
import { kungfuRoute } from './interface/endpoint/kungfu-route';
import { schoolRoute } from './interface/endpoint/school-route';
import { userRoute } from './interface/endpoint/user-route';

await initializeLogger();

const server = app
  .use(gameServerRoute)
  .use(idiomRoute)
  .use(kungfuRoute)
  .use(schoolRoute)
  .use(userRoute);

export type App = typeof server;

server.listen(3001);

logger.info(
  `🦊 Elysia is running at ${server.server?.hostname}:${server.server?.port}`,
);
