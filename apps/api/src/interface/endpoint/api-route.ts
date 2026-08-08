import { Elysia } from 'elysia';
import { logger } from '@/infrastructure/logger';
import { AppException, ERROR_CODES } from '@/shared/exception';
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
      return status(
        error.statusCode,
        AppResponse.fromException(error).toJson(),
      );
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
