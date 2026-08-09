import { logger } from '@api/infrastructure/logger';
import { ERROR_CODES } from '@api/shared/exception/error-code';
import { auth } from '@api/shared/util/auth';
import { Elysia } from 'elysia';
import { AppResponse } from '../schema/common';

export const authMacro = new Elysia({ name: 'auth-macro' }).macro({
  auth: (requiredRole: 'user' | 'admin') => {
    return {
      seed: requiredRole,
      resolve: async ({ status, request }) => {
        const result = await auth.api.getSession({
          headers: request.headers,
        });

        if (!result) {
          logger.error('Unauthorized access, no session found');
          return status(
            401,
            AppResponse.error({
              code: ERROR_CODES.UNAUTHORIZED,
              message: 'Unauthorized',
            }).toJson(),
          );
        }

        if (requiredRole === 'admin' && result.user.role !== 'admin') {
          logger.error('Forbidden access, user is not an admin');
          return status(
            403,
            AppResponse.error({
              code: ERROR_CODES.FORBIDDEN,
              message: 'Forbidden',
            }).toJson(),
          );
        }

        return {
          user: result.user,
          session: result.session,
        };
      },
    };
  },
});
