import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserBanDialogComponent } from '@/routes/_authenticated/admin/users/-components/UserBanDialogComponent';

describe('UserBanDialogComponent', () => {
  it('submits a reason and duration', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <UserBanDialogComponent
        open
        pending={false}
        userName="Alice"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/封禁「Alice」/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('原因'), 'spam');
    await user.click(screen.getByRole('button', { name: '7 天' }));
    await user.click(screen.getByRole('button', { name: '封禁' }));
    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'spam',
      banExpiresIn: 60 * 60 * 24 * 7,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a validation error and a generic description', async () => {
    const user = userEvent.setup();
    render(
      <UserBanDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText('封禁后对方将无法登录，已有会话会被撤销。'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '封禁' }));
    expect(screen.getByText('请填写封禁原因')).toBeInTheDocument();
  });

  it('resets when reopened and ignores an empty duration toggle', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <UserBanDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('原因'), 'old');
    rerender(
      <UserBanDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    rerender(
      <UserBanDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('原因')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: '永久' }));
    await user.type(screen.getByLabelText('原因'), 'spam');
    await user.click(screen.getByRole('button', { name: '封禁' }));
  });

  it('maps remaining duration presets', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <UserBanDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('原因'), 'spam');
    await user.click(screen.getByRole('button', { name: '1 天' }));
    await user.click(screen.getByRole('button', { name: '封禁' }));
    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'spam',
      banExpiresIn: 60 * 60 * 24,
    });

    await user.click(screen.getByRole('button', { name: '30 天' }));
    await user.click(screen.getByRole('button', { name: '封禁' }));
    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'spam',
      banExpiresIn: 60 * 60 * 24 * 30,
    });
  });

  it('shows a pending spinner', () => {
    render(
      <UserBanDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading封禁/ })).toBeDisabled();
  });
});
