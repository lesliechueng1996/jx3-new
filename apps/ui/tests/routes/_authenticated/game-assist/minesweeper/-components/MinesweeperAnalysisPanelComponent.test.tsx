import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MinesweeperAnalysisPanelComponent from '@/routes/_authenticated/game-assist/minesweeper/-components/MinesweeperAnalysisPanelComponent';

describe('MinesweeperAnalysisPanelComponent', () => {
  it('shows the empty hint', () => {
    render(
      <MinesweeperAnalysisPanelComponent
        analysis={null}
        onCopy={vi.fn()}
        onApplyExplode={vi.fn()}
        onApplyFlag={vi.fn()}
      />,
    );
    expect(screen.getByText(/对照游戏同步棋盘后/)).toBeInTheDocument();
  });

  it('copies and applies suggestions', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onApplyExplode = vi.fn();
    const onApplyFlag = vi.fn();

    render(
      <MinesweeperAnalysisPanelComponent
        analysis={{
          explodeText: '11 12',
          flagText: '21',
          explodeKeys: ['0-0', '0-1'],
          flagKeys: ['1-0'],
          stuck: false,
        }}
        onCopy={onCopy}
        onApplyExplode={onApplyExplode}
        onApplyFlag={onApplyFlag}
      />,
    );

    await user.click(screen.getByRole('button', { name: '一键点开' }));
    expect(onApplyExplode).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '一键插旗' }));
    expect(onApplyFlag).toHaveBeenCalled();
    await user.click(screen.getAllByRole('button', { name: '复制' })[0]);
    expect(onCopy).toHaveBeenCalledWith('11 12');
  });

  it('shows the stuck alert and disables empty actions', () => {
    render(
      <MinesweeperAnalysisPanelComponent
        analysis={{
          explodeText: '',
          flagText: '',
          explodeKeys: [],
          flagKeys: [],
          stuck: true,
        }}
        onCopy={vi.fn()}
        onApplyExplode={vi.fn()}
        onApplyFlag={vi.fn()}
      />,
    );
    expect(screen.getByText('暂时没有确定的下一步')).toBeInTheDocument();
    expect(screen.getAllByText('没有建议')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '一键点开' })).toBeDisabled();
  });
});
