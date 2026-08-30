import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RecommendedGuessesComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/RecommendedGuessesComponent';

describe('RecommendedGuessesComponent', () => {
  it('fills the selected recommended idiom', async () => {
    const user = userEvent.setup();
    const onSelectIdiom = vi.fn();
    render(<RecommendedGuessesComponent onSelectIdiom={onSelectIdiom} />);

    expect(screen.getByText('推荐尝试')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '填入 漏网之鱼' }));
    expect(onSelectIdiom).toHaveBeenCalledWith('漏网之鱼');
    await user.click(screen.getByRole('button', { name: '填入 卧薪尝胆' }));
    expect(onSelectIdiom).toHaveBeenCalledWith('卧薪尝胆');
  });
});
