export { initializeLogger } from './config';

import { getLogger } from '@logtape/logtape';
import { APP_LOGGER_CATEGORY } from './config';

export const logger = getLogger(APP_LOGGER_CATEGORY);
