import { describe, expect, it } from 'bun:test';
import { Jx3ApiError } from '../src/errors';

describe('Jx3ApiError', () => {
  it('stores code, optional status, and cause', () => {
    const cause = new Error('offline');
    const error = new Jx3ApiError('Failed to reach upstream API', {
      code: 'NETWORK_ERROR',
      status: 502,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('Jx3ApiError');
    expect(error.message).toBe('Failed to reach upstream API');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBe(502);
    expect(error.cause).toBe(cause);
  });

  it('omits status when it is not provided', () => {
    const error = new Jx3ApiError('No icon found', { code: 'NOT_FOUND' });

    expect(error.status).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
