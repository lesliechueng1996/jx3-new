import { AsyncLocalStorage } from 'node:async_hooks';
import { formatDate } from '@api/shared/util/date';
import { getTimeRotatingFileSink } from '@logtape/file';
import {
  configure,
  getAnsiColorFormatter,
  getConsoleSink,
  getTextFormatter,
  type TextFormatterOptions,
} from '@logtape/logtape';

export const APP_LOGGER_CATEGORY = 'app';

const formatterOptions: TextFormatterOptions = {
  timestamp: (timestamp) => formatDate(new Date(timestamp)),
  format: ({ timestamp, level, category, message, record }) =>
    `${timestamp ? `${timestamp} ` : ''}[${level}] ${category}: ${record.properties.requestId ? `[${record.properties.requestId}] ` : ''}- ${message}`,
};

const ansiColorFormatter = getAnsiColorFormatter(formatterOptions);

const textFormatter = getTextFormatter(formatterOptions);

export const initializeLogger = async () => {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: ansiColorFormatter,
      }),
      file: getTimeRotatingFileSink({
        directory: './logs',
        interval: 'daily',
        maxAgeMs: 7 * 24 * 60 * 60 * 1000,
        formatter: textFormatter,
      }),
    },
    loggers: [
      {
        category: ['logtape', 'meta'],
        lowestLevel: 'warning',
        sinks: ['console'],
      },
      {
        category: APP_LOGGER_CATEGORY,
        lowestLevel: 'debug',
        sinks: ['console', 'file'],
      },
      {
        category: ['drizzle-orm'],
        sinks: ['console', 'file'],
        lowestLevel: 'debug',
      },
    ],
    contextLocalStorage: new AsyncLocalStorage(),
  });
};
