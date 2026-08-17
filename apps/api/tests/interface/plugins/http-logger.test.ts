import { describe, expect, it, mock } from 'bun:test';

const elysiaLogger = mock((options: unknown) => ({ options }));

mock.module('@logtape/elysia', () => ({
  elysiaLogger,
}));

mock.module('@api/infrastructure/logger/config', () => ({
  APP_LOGGER_CATEGORY: 'app',
}));

await import('@api/interface/plugins/http-logger');

describe('httpLogger', () => {
  it('configures the Elysia LogTape plugin', () => {
    expect(elysiaLogger).toHaveBeenCalledWith({
      category: ['app', 'http'],
      context: true,
      scope: 'global',
    });
    expect(elysiaLogger.mock.results[0]?.value).toEqual({
      options: {
        category: ['app', 'http'],
        context: true,
        scope: 'global',
      },
    });
  });
});
