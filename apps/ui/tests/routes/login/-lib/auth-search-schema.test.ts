import { describe, expect, it } from 'vitest';
import { authSearchSchema } from '@/routes/login/-lib/auth-search-schema';

describe('authSearchSchema', () => {
  it('keeps an internal redirect path', () => {
    expect(authSearchSchema.parse({ redirect: '/admin/idioms' })).toEqual({
      redirect: '/admin/idioms',
    });
  });

  it('drops protocol-relative and non-path redirects', () => {
    expect(authSearchSchema.parse({ redirect: '//evil.example' })).toEqual({
      redirect: undefined,
    });
    expect(
      authSearchSchema.parse({ redirect: 'https://evil.example' }),
    ).toEqual({
      redirect: undefined,
    });
  });

  it('allows a missing redirect', () => {
    expect(authSearchSchema.parse({})).toEqual({ redirect: undefined });
  });
});
