import { app } from './app';
import { initializeLogger, logger } from './infrastructure/logger';
import { createIdiomRoute } from './interface/endpoint/idiom-route';

await initializeLogger();

app.use(createIdiomRoute).listen(3001);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
