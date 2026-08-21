import { beforeEach, describe, expect, it, vi } from 'vitest';

const { avatarPost, passwordPost } = vi.hoisted(() => ({
  avatarPost: vi.fn(),
  passwordPost: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        user: {
          avatar: {
            post: avatarPost,
          },
          password: {
            post: passwordPost,
          },
        },
      },
    },
  },
}));

describe('profile-api', () => {
  beforeEach(() => {
    avatarPost.mockReset();
    passwordPost.mockReset();
  });

  it('uploads an avatar and unwraps the envelope', async () => {
    const file = new File(['png'], 'a.png', { type: 'image/png' });
    avatarPost.mockResolvedValue({
      data: { data: { imageUrl: 'http://cdn/a.png' } },
      error: null,
    });

    const { uploadAvatar } = await import('@/lib/api/profile-api');
    await expect(uploadAvatar(file)).resolves.toEqual({
      imageUrl: 'http://cdn/a.png',
    });
    expect(avatarPost).toHaveBeenCalledWith({ file });
  });

  it('throws the API message when avatar upload fails', async () => {
    avatarPost.mockResolvedValue({
      data: null,
      error: { value: { message: '太大了' } },
    });
    const { uploadAvatar } = await import('@/lib/api/profile-api');
    await expect(
      uploadAvatar(new File(['png'], 'a.png', { type: 'image/png' })),
    ).rejects.toThrow('太大了');
  });

  it('uses a fallback message when avatar upload omits one', async () => {
    avatarPost.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { uploadAvatar } = await import('@/lib/api/profile-api');
    await expect(
      uploadAvatar(new File(['png'], 'a.png', { type: 'image/png' })),
    ).rejects.toThrow('上传头像失败');
  });

  it('changes the password and unwraps the envelope', async () => {
    passwordPost.mockResolvedValue({
      data: { data: null },
      error: null,
    });

    const { changePassword } = await import('@/lib/api/profile-api');
    await expect(
      changePassword({
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
      }),
    ).resolves.toBeNull();
    expect(passwordPost).toHaveBeenCalledWith({
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
    });
  });

  it('throws the API message when changing password fails', async () => {
    passwordPost.mockResolvedValue({
      data: null,
      error: { value: { message: '当前密码错误' } },
    });
    const { changePassword } = await import('@/lib/api/profile-api');
    await expect(
      changePassword({
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
      }),
    ).rejects.toThrow('当前密码错误');
  });

  it('uses a fallback message when changing password omits one', async () => {
    passwordPost.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { changePassword } = await import('@/lib/api/profile-api');
    await expect(
      changePassword({
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
      }),
    ).rejects.toThrow('修改密码失败');
  });
});
