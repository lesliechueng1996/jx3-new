import { describe, expect, it } from 'bun:test';
import { generateUUID } from '@api/shared/util/uuid';

describe('generateUUID', () => {
  it('returns a UUID string from the runtime', () => {
    const value = generateUUID();

    expect(value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
