import { describe, expect, it } from 'bun:test';
import { applySetCookieHeaders } from '@api/shared/util/auth-cookies';
import { Elysia } from 'elysia';

describe('applySetCookieHeaders', () => {
  it('does nothing when there are no cookies', async () => {
    const app = new Elysia().get('/', ({ set }) => {
      applySetCookieHeaders(set, []);
      return 'ok';
    });
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('sets a single cookie', async () => {
    const app = new Elysia().get('/', ({ set }) => {
      applySetCookieHeaders(set, ['session=abc']);
      return 'ok';
    });
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.headers.getSetCookie()).toEqual(['session=abc']);
  });

  it('sets multiple cookies without joining them', async () => {
    const app = new Elysia().get('/', ({ set }) => {
      applySetCookieHeaders(set, ['session=abc', 'cache=xyz']);
      return 'ok';
    });
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.headers.getSetCookie()).toEqual([
      'session=abc',
      'cache=xyz',
    ]);
  });
});
