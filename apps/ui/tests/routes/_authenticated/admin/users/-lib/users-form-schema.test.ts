import { describe, expect, it } from 'vitest';
import {
  banDurationToSeconds,
  banUserFormSchema,
  createUserFormSchema,
  editUserFormSchema,
} from '@/routes/_authenticated/admin/users/-lib/users-form-schema';

describe('createUserFormSchema', () => {
  it('accepts a complete create payload', () => {
    expect(
      createUserFormSchema.parse({
        name: ' Alice ',
        email: 'alice@example.com',
        password: 'password1',
        role: 'user',
      }),
    ).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password1',
      role: 'user',
    });
  });

  it('rejects a short password', () => {
    const result = createUserFormSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
      role: 'user',
    });
    expect(result.success).toBe(false);
  });
});

describe('editUserFormSchema', () => {
  it('omits blank email and password', () => {
    expect(
      editUserFormSchema.parse({
        name: 'Alice',
        email: '',
        password: '',
        role: 'admin',
      }),
    ).toEqual({
      name: 'Alice',
      email: undefined,
      password: undefined,
      role: 'admin',
    });
  });

  it('keeps a new email and password', () => {
    expect(
      editUserFormSchema.parse({
        name: 'Alice',
        email: 'new@example.com',
        password: 'password2',
        role: 'user',
      }),
    ).toEqual({
      name: 'Alice',
      email: 'new@example.com',
      password: 'password2',
      role: 'user',
    });
  });
});

describe('banUserFormSchema', () => {
  it('trims the reason', () => {
    expect(
      banUserFormSchema.parse({
        reason: '  spam  ',
        duration: '1d',
      }),
    ).toEqual({
      reason: 'spam',
      duration: '1d',
    });
  });
});

describe('banDurationToSeconds', () => {
  it('maps presets to seconds', () => {
    expect(banDurationToSeconds('permanent')).toBeUndefined();
    expect(banDurationToSeconds('1d')).toBe(60 * 60 * 24);
    expect(banDurationToSeconds('7d')).toBe(60 * 60 * 24 * 7);
    expect(banDurationToSeconds('30d')).toBe(60 * 60 * 24 * 30);
  });
});
