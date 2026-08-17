import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IdiomFiltersComponent from '@/routes/_authenticated/admin/idioms/-components/IdiomFiltersComponent';

describe('IdiomFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <IdiomFiltersComponent
        committedFilters={{ page: 3, pageSize: 20, text: '旧' }}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const input = screen.getByLabelText('成语');
    await user.clear(input);
    await user.type(input, '一心');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      text: '一心',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <IdiomFiltersComponent
        committedFilters={{ page: 1, pageSize: 20, text: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText('成语'), '一{Enter}');
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      text: '一',
    });
  });
});
