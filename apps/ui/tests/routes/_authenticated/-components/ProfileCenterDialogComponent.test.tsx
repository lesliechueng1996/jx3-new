import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileCenterDialogComponent } from '@/routes/_authenticated/-components/ProfileCenterDialogComponent';

describe('ProfileCenterDialogComponent', () => {
  it('uploads the selected avatar and can cancel', async () => {
    const user = userEvent.setup();
    const onUploadAvatar = vi.fn();
    const onOpenChange = vi.fn();
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });

    render(
      <ProfileCenterDialogComponent
        user={{ name: 'Alice', email: 'alice@example.com', image: null }}
        open
        avatarPending={false}
        passwordPending={false}
        passwordFormKey={0}
        onOpenChange={onOpenChange}
        onUploadAvatar={onUploadAvatar}
        onChangePassword={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '上传头像' })).toBeDisabled();
    await user.upload(screen.getByLabelText('选择图片'), file);
    expect(screen.getByText('已选择：avatar.png')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '上传头像' }));
    expect(onUploadAvatar).toHaveBeenCalledWith(file);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the current avatar image and disables upload while pending', () => {
    render(
      <ProfileCenterDialogComponent
        user={{
          name: 'Alice',
          email: 'alice@example.com',
          image: 'https://example.com/a.png',
        }}
        open
        avatarPending
        passwordPending={false}
        passwordFormKey={0}
        onOpenChange={vi.fn()}
        onUploadAvatar={vi.fn()}
        onChangePassword={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('选择图片')).toBeDisabled();
    expect(screen.getByRole('button', { name: /上传头像/ })).toBeDisabled();
  });

  it('falls back to an initial when name and email are empty', () => {
    render(
      <ProfileCenterDialogComponent
        user={{ name: '', email: '', image: null }}
        open
        avatarPending={false}
        passwordPending={false}
        passwordFormKey={0}
        onOpenChange={vi.fn()}
        onUploadAvatar={vi.fn()}
        onChangePassword={vi.fn()}
      />,
    );

    expect(screen.getByText('用')).toBeInTheDocument();
  });
});
