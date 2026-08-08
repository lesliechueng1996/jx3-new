export { initializeLogger } from './config';

import { getLogger, lazy } from '@logtape/logtape';
import { APP_LOGGER_CATEGORY } from './config';

const logContext = {
  requestId: '',
};

export const logger = getLogger(APP_LOGGER_CATEGORY);

export const ctxLogger = logger.with({
  'request-id': lazy(() => logContext.requestId),
});

export const updateLogContext = (
  key: keyof typeof logContext,
  value: string,
) => {
  logContext[key] = value;
};
