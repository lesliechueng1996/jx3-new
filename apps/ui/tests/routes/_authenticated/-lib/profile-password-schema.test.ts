import { describe, expect, it } from 'vitest';
import { profilePasswordFormSchema } from '@/routes/_authenticated/-lib/profile-password-schema';

describe('profilePasswordFormSchema', () => {
  it('accepts matching passwords', () => {
    expect(
      profilePasswordFormSchema.parse({
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
        confirmPassword: 'new-pass1',
      }),
    ).toEqual({
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
      confirmPassword: 'new-pass1',
    });
  });

  it('rejects an empty current password', () => {
    const result = profilePasswordFormSchema.safeParse({
      currentPassword: '',
      newPassword: 'new-pass1',
      confirmPassword: 'new-pass1',
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected failure');
    }
    expect(result.error.issues[0]?.message).toBe('请输入当前密码');
  });

  it('rejects a short new password', () => {
    const result = profilePasswordFormSchema.safeParse({
      currentPassword: 'old-pass1',
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing confirmation', () => {
    const result = profilePasswordFormSchema.safeParse({
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected failure');
    }
    expect(
      result.error.issues.some((issue) => issue.message === '请再次输入新密码'),
    ).toBe(true);
  });

  it('rejects mismatched confirmation', () => {
    const result = profilePasswordFormSchema.safeParse({
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
      confirmPassword: 'other-pass',
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected failure');
    }
    expect(result.error.issues[0]?.message).toBe('两次输入的新密码不一致');
  });
});
