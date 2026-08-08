import { Elysia } from 'elysia';
import { updateLogContext } from '@/infrastructure/logger';
import { generateUUID } from '@/shared/util/uuid';

const requestIdHeaderKey = 'x-request-id';

export const requestId = () => {
  return new Elysia({
    name: 'request-id',
  })
    .derive(({ headers }) => {
      let requestId = headers[requestIdHeaderKey];
      if (!requestId) {
        requestId = generateUUID();
      }

      updateLogContext('requestId', requestId);

      return {
        requestId,
      };
    })
    .onAfterHandle(({ requestId, set }) => {
      set.headers[requestIdHeaderKey] = requestId;
    })
    .as('global');
};
