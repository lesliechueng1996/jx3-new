import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GuessCellComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/GuessCellComponent';
import type { GuessCellState } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

const cell: GuessCellState = {
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
};

describe('GuessCellComponent', () => {
  it('cycles character color black → orange → green → black', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <GuessCellComponent cell={cell} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: '一' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ charColor: 'orange' }),
    );

    rerender(
      <GuessCellComponent
        cell={{ ...cell, charColor: 'orange' }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: '一' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ charColor: 'green' }),
    );

    rerender(
      <GuessCellComponent
        cell={{ ...cell, charColor: 'green' }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: '一' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ charColor: 'black' }),
    );
  });

  it('cycles initial, final, tone, and syllable link colors', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GuessCellComponent cell={cell} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '∅' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ initialColor: 'orange' }),
    );
    await user.click(screen.getByRole('button', { name: 'i' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ finalColor: 'orange' }),
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ toneColor: 'orange' }),
    );
    await user.click(screen.getByRole('button', { name: '切换音节关联线' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ syllableLink: 'orange' }),
    );
  });
});
