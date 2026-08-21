import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePasswordFormComponent } from '@/routes/_authenticated/-components/ProfilePasswordFormComponent';

describe('ProfilePasswordFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ProfilePasswordFormComponent
        formId="profile-password-form"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存密码' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入当前密码')).toBeInTheDocument();
  });

  it('shows a mismatch error on confirm password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ProfilePasswordFormComponent
        formId="profile-password-form"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('当前密码'), 'old-pass1');
    await user.type(screen.getByLabelText('新密码'), 'new-pass1');
    await user.type(screen.getByLabelText('确认新密码'), 'other-pass');
    await user.click(screen.getByRole('button', { name: '保存密码' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('两次输入的新密码不一致')).toBeInTheDocument();
  });

  it('shows a short password error', async () => {
    const user = userEvent.setup();
    render(
      <ProfilePasswordFormComponent
        formId="profile-password-form"
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('当前密码'), 'old-pass1');
    await user.type(screen.getByLabelText('新密码'), 'short');
    await user.type(screen.getByLabelText('确认新密码'), 'short');
    await user.click(screen.getByRole('button', { name: '保存密码' }));
    expect(screen.getByText('密码至少 8 位')).toBeInTheDocument();
  });

  it('submits valid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ProfilePasswordFormComponent
        formId="profile-password-form"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('当前密码'), 'old-pass1');
    await user.type(screen.getByLabelText('新密码'), 'new-pass1');
    await user.type(screen.getByLabelText('确认新密码'), 'new-pass1');
    await user.click(screen.getByRole('button', { name: '保存密码' }));

    expect(onSubmit).toHaveBeenCalledWith({
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
      confirmPassword: 'new-pass1',
    });
  });

  it('disables fields while pending', () => {
    render(
      <ProfilePasswordFormComponent
        formId="profile-password-form"
        pending
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('当前密码')).toBeDisabled();
    expect(screen.getByRole('button', { name: /保存密码/ })).toBeDisabled();
  });
});
