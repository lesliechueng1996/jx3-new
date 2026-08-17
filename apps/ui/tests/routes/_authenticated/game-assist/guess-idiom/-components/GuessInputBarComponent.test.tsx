import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GuessInputBarComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/GuessInputBarComponent';

describe('GuessInputBarComponent', () => {
  it('submits from the button and Enter key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <GuessInputBarComponent
        value="一心"
        disabled={false}
        maxRoundsReached={false}
        pending={false}
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '一意');
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    expect(onSubmit).toHaveBeenCalled();
    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('shows the max-round hint and pending label', () => {
    const { rerender } = render(
      <GuessInputBarComponent
        value=""
        disabled={false}
        maxRoundsReached
        pending={false}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('最多录入 15 轮猜测')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交猜测' })).toBeDisabled();

    rerender(
      <GuessInputBarComponent
        value=""
        disabled={false}
        maxRoundsReached={false}
        pending
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '解析中…' })).toBeDisabled();
  });
});
