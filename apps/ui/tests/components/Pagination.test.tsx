import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Pagination from '@/components/Pagination';

describe('Pagination', () => {
  it('moves to the previous and next page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        total={100}
        page={2}
        totalPages={5}
        isPreviousPageDisabled={false}
        isNextPageDisabled={false}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText('共 100 条，第 2 / 5 页')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '上一页' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: '下一页' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('clamps jump-to-page input and ignores NaN', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        total={40}
        page={2}
        totalPages={4}
        isPreviousPageDisabled={false}
        isNextPageDisabled={false}
        onPageChange={onPageChange}
      />,
    );

    const input = screen.getByLabelText('跳转到页码');
    await user.clear(input);
    await user.type(input, '99');
    await user.tab();
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();
    expect(onPageChange).toHaveBeenCalledTimes(1);

    await user.clear(input);
    await user.type(input, '3');
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.clear(input);
    await user.type(input, '2');
    await user.tab();
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });
});
