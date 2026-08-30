import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GuessRoundListComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/GuessRoundListComponent';
import type { GuessRoundState } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

const round: GuessRoundState = {
  id: 'r1',
  text: '一心一意',
  inDatabase: true,
  cells: [
    {
      position: 0,
      char: '一',
      pinyin: 'yi1',
      initial: '',
      final: 'i',
      tone: 1,
      charColor: 'black',
      initialColor: 'black',
      finalColor: 'black',
      toneColor: 'black',
      syllableLink: 'black',
    },
  ],
};

describe('GuessRoundListComponent', () => {
  it('shows an empty hint', () => {
    render(
      <GuessRoundListComponent
        rounds={[]}
        onChangeRound={vi.fn()}
        onRemoveRound={vi.fn()}
      />,
    );
    expect(screen.getByText(/还没有录入猜测/)).toBeInTheDocument();
  });

  it('forwards change and remove', async () => {
    const user = userEvent.setup();
    const onChangeRound = vi.fn();
    const onRemoveRound = vi.fn();
    render(
      <GuessRoundListComponent
        rounds={[round]}
        onChangeRound={onChangeRound}
        onRemoveRound={onRemoveRound}
      />,
    );

    expect(screen.getByText('第 1 轮')).toBeInTheDocument();
    expect(screen.getByText('词库')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除本轮' }));
    expect(onRemoveRound).toHaveBeenCalledWith('r1');
    await user.click(screen.getByRole('button', { name: '一' }));
    expect(onChangeRound).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({
        cells: [expect.objectContaining({ charColor: 'orange' })],
      }),
    );
    await user.click(screen.getByRole('button', { name: '重置本轮颜色' }));
    expect(onChangeRound).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({
        cells: [
          expect.objectContaining({
            charColor: 'black',
            initialColor: 'black',
            finalColor: 'black',
            toneColor: 'black',
            syllableLink: 'black',
          }),
        ],
      }),
    );
  });
});
