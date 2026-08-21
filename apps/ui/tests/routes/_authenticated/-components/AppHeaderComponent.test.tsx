import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { AppHeaderComponent } from '@/routes/_authenticated/-components/AppHeaderComponent';
import { adminSession, userSession } from '../../../helpers/session';

const navigate = vi.fn();
const invalidate = vi.fn();
const {
  clearSessionQuery,
  patchCachedSessionUser,
  uploadAvatar,
  changePassword,
} = vi.hoisted(() => ({
  clearSessionQuery: vi.fn(),
  patchCachedSessionUser: vi.fn(),
  uploadAvatar: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useRouter: () => ({ invalidate }),
  };
});

vi.mock('@/lib/auth-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-session')>();
  return {
    ...actual,
    clearSessionQuery,
    patchCachedSessionUser,
  };
});

vi.mock('@/lib/api/profile-api', () => ({
  uploadAvatar,
  changePassword,
}));

function renderHeader(user: {
  name: string;
  email: string;
  image?: string | null;
}) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SidebarProvider>
        <AppHeaderComponent user={user} />
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

describe('AppHeaderComponent', () => {
  beforeEach(() => {
    clearSessionQuery.mockClear();
    patchCachedSessionUser.mockReset();
    invalidate.mockReset();
    navigate.mockClear();
    uploadAvatar.mockReset();
    changePassword.mockReset();
    vi.mocked(toast.add).mockClear();
    vi.mocked(authClient.signOut).mockReset();
    invalidate.mockResolvedValue(undefined);
  });

  it('signs out and navigates to login', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({ error: null } as never);
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(clearSessionQuery).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('toasts when sign-out fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({
      error: { message: '网络错误' },
    } as never);
    renderHeader(userSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '退出失败',
          description: '网络错误',
        }),
      );
    });
  });

  it('uses a fallback initial and error message', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signOut).mockResolvedValue({
      error: {},
    } as never);
    renderHeader({ name: '', email: '', image: null });

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('退出登录'));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '退出登录失败' }),
      );
    });
  });

  it('opens the profile dialog and uploads an avatar', async () => {
    const user = userEvent.setup();
    uploadAvatar.mockResolvedValue({ imageUrl: 'http://cdn/a.png' });
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('个人中心'));
    expect(await screen.findByText('个人中心')).toBeInTheDocument();

    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('选择图片'), file);
    await user.click(screen.getByRole('button', { name: '上传头像' }));

    await waitFor(() => {
      expect(uploadAvatar).toHaveBeenCalled();
      expect(uploadAvatar.mock.calls[0]?.[0]).toBeInstanceOf(File);
      expect(toast.add).toHaveBeenCalledWith({
        type: 'success',
        title: '头像已更新',
      });
      expect(patchCachedSessionUser).toHaveBeenCalledWith({
        image: 'http://cdn/a.png',
      });
      expect(invalidate).toHaveBeenCalled();
    });
  });

  it('toasts when avatar upload fails', async () => {
    const user = userEvent.setup();
    uploadAvatar.mockRejectedValue(new Error('太大了'));
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('个人中心'));
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('选择图片'), file);
    await user.click(screen.getByRole('button', { name: '上传头像' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '太大了',
      });
    });
  });

  it('changes the password from the profile dialog', async () => {
    const user = userEvent.setup();
    changePassword.mockResolvedValue(null);
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('个人中心'));
    await user.type(screen.getByLabelText('当前密码'), 'old-pass1');
    await user.type(screen.getByLabelText('新密码'), 'new-pass1');
    await user.type(screen.getByLabelText('确认新密码'), 'new-pass1');
    await user.click(screen.getByRole('button', { name: '保存密码' }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-pass1',
        newPassword: 'new-pass1',
      });
      expect(toast.add).toHaveBeenCalledWith({
        type: 'success',
        title: '密码已修改',
      });
    });
  });

  it('toasts when changing password fails', async () => {
    const user = userEvent.setup();
    changePassword.mockRejectedValue(new Error('当前密码错误'));
    renderHeader(adminSession.user);

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }));
    await user.click(await screen.findByText('个人中心'));
    await user.type(screen.getByLabelText('当前密码'), 'old-pass1');
    await user.type(screen.getByLabelText('新密码'), 'new-pass1');
    await user.type(screen.getByLabelText('确认新密码'), 'new-pass1');
    await user.click(screen.getByRole('button', { name: '保存密码' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '当前密码错误',
      });
    });
  });
});
