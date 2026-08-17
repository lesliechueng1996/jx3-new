import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IdiomCreateDialogComponent } from '@/routes/_authenticated/admin/idioms/-components/IdiomCreateDialogComponent';

describe('IdiomCreateDialogComponent', () => {
  it('submits trimmed values and treats blank meaning as null', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <IdiomCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
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

  it('submits null meaning when the field is blank', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <IdiomCreateDialogComponent
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
