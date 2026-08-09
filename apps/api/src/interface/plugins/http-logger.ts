import { APP_LOGGER_CATEGORY } from '@api/infrastructure/logger/config';
import { elysiaLogger } from '@logtape/elysia';

/**
 * HTTP access logging + per-request LogTape implicit context (requestId).
 * Requires `contextLocalStorage` in logger configure().
 */
export const httpLogger = elysiaLogger({
  category: [APP_LOGGER_CATEGORY, 'http'],
  context: true,
  scope: 'global',
});
