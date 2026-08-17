import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('confirms and closes', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="删除成语"
        description="确定删除吗？"
        confirmLabel="删除"
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('删除成语')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables actions while pending and uses default labels', async () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="确认"
        pending
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '确认' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '取消' })).toBeDisabled();
  });
});
