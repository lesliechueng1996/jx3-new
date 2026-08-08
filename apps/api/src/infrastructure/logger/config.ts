import { getTimeRotatingFileSink } from '@logtape/file';
import {
  configure,
  getAnsiColorFormatter,
  getConsoleSink,
} from '@logtape/logtape';
import { formatDate } from '@/shared/util/date';

export const APP_LOGGER_CATEGORY = 'app';

const ansiColorFormatter = getAnsiColorFormatter({
  timestamp: (timestamp) => formatDate(new Date(timestamp)),
});

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
        formatter: ansiColorFormatter,
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
    ],
  });
};
