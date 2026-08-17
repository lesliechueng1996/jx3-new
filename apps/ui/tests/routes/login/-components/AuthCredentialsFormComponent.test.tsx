import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthCredentialsFormComponent } from '@/routes/login/-components/AuthCredentialsFormComponent';

describe('AuthCredentialsFormComponent', () => {
  it('does not submit invalid credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AuthCredentialsFormComponent isPending={false} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/请输入/)).toBeInTheDocument();
  });

  it('submits valid credentials and toggles password visibility', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AuthCredentialsFormComponent isPending={false} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText('邮箱'), 'user@example.com');
    await user.type(screen.getByLabelText('密码'), 'password1');
    await user.click(screen.getByRole('button', { name: '显示密码' }));
    expect(screen.getByLabelText('密码')).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: '隐藏密码' }));
    expect(screen.getByLabelText('密码')).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password1',
    });
  });

  it('shows a pending label', () => {
    render(<AuthCredentialsFormComponent isPending onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled();
  });
});
