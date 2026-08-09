import { logger } from '@api/infrastructure/logger';
import { AppException, ERROR_CODES } from '@api/shared/exception';
import { Elysia } from 'elysia';
import { authMacro } from '../plugins/auth-macro';
import { AppResponse } from '../schema/common';

export const apiRoute = new Elysia({ prefix: '/api/v1' })
  .onError(({ code, error, status }) => {
    logger.error('API error, {error}', { error });

    if (code === 'VALIDATION') {
      return status(
        400,
        AppResponse.error({
          code: ERROR_CODES.BAD_REQUEST,
          message: (error.customError as string) ?? error.all[0].message,
        }).toJson(),
      );
    }

    if (error instanceof AppException) {
      const body = AppResponse.fromException(error).toJson();

      // Use literal status codes so Eden keeps per-status response types
      // instead of collapsing to `{ [status: number]: ... }`.
      switch (error.statusCode) {
        case 400:
          return status(400, body);
        case 401:
          return status(401, body);
        case 403:
          return status(403, body);
        case 404:
          return status(404, body);
        case 409:
          return status(409, body);
        case 429:
          return status(429, body);
        default:
          return status(500, body);
      }
    }

    return status(
      500,
      AppResponse.error({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }).toJson(),
    );
  })
  .use(authMacro);
