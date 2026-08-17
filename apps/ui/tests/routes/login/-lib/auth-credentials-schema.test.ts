import { describe, expect, it } from 'vitest';
import { authCredentialsSchema } from '@/routes/login/-lib/auth-credentials-schema';

describe('authCredentialsSchema', () => {
  it('accepts a valid email and password', () => {
    expect(
      authCredentialsSchema.parse({
        email: 'user@example.com',
        password: 'password1',
      }),
    ).toEqual({
      email: 'user@example.com',
      password: 'password1',
    });
  });

  it('rejects an invalid email', () => {
    const result = authCredentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('请输入有效的邮箱地址');
    }
  });

  it('rejects a short password', () => {
    const result = authCredentialsSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === '密码至少 8 位'),
      ).toBe(true);
    }
  });
});
