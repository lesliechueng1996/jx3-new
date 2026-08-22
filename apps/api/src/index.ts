import { app } from './app';
import { initializeLogger, logger } from './infrastructure/logger';
import { gameDungeonRoute } from './interface/endpoint/game-dungeon-route';
import { gameExpansionRoute } from './interface/endpoint/game-expansion-route';
import { gameSeasonRoute } from './interface/endpoint/game-season-route';
import { gameServerRoute } from './interface/endpoint/game-server-route';
import { idiomRoute } from './interface/endpoint/idiom-route';
import { kungfuRoute } from './interface/endpoint/kungfu-route';
import { schoolRoute } from './interface/endpoint/school-route';
import { userRoute } from './interface/endpoint/user-route';

await initializeLogger();

const server = app
  .use(gameDungeonRoute)
  .use(gameExpansionRoute)
  .use(gameSeasonRoute)
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
