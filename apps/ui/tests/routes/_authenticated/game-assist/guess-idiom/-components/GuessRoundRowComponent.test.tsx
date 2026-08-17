import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GuessRoundRowComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/GuessRoundRowComponent';
import type { GuessRoundState } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

const round: GuessRoundState = {
  id: 'r1',
  text: '三心二意',
  inDatabase: false,
  cells: [
    {
      position: 0,
      char: '三',
      pinyin: 'san1',
      initial: 's',
      final: 'an',
      tone: 1,
      charColor: 'black',
      initialColor: 'black',
      finalColor: 'black',
      toneColor: 'black',
      syllableLink: 'black',
    },
  ],
};

describe('GuessRoundRowComponent', () => {
  it('shows auto-pinyin badge and removes the round', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <GuessRoundRowComponent
        round={round}
        index={2}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('第 3 轮')).toBeInTheDocument();
    expect(screen.getByText('自动拼音')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除本轮' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
