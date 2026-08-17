import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IdiomQuickAddDialogComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/IdiomQuickAddDialogComponent';

describe('IdiomQuickAddDialogComponent', () => {
  it('submits trimmed values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <IdiomQuickAddDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('成语'), ' 一心一意 ');
    await user.type(screen.getByLabelText('释义'), ' 专心 ');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      text: '一心一意',
      meaning: '专心',
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows pending copy and null meaning', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <IdiomQuickAddDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole('button', { name: '保存中…' })).toBeDisabled();

    rerender(
      <IdiomQuickAddDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText('成语'), '一心一意');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      text: '一心一意',
      meaning: null,
    });
  });
});
