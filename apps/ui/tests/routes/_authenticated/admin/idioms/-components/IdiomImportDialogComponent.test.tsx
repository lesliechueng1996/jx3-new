import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IdiomImportDialogComponent } from '@/routes/_authenticated/admin/idioms/-components/IdiomImportDialogComponent';

describe('IdiomImportDialogComponent', () => {
  it('imports the selected file', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    const file = new File(['text\n一心一意'], 'idioms.csv', {
      type: 'text/csv',
    });

    render(
      <IdiomImportDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: '导入' })).toBeDisabled();
    await user.upload(screen.getByLabelText('CSV 文件'), file);
    expect(screen.getByText('已选择：idioms.csv')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '导入' }));
    expect(onSubmit).toHaveBeenCalledWith(file);

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
