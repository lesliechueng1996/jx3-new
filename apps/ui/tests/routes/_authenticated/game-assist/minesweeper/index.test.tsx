import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

async function startCustomGame(
  user: ReturnType<typeof userEvent.setup>,
  rows: string,
  columns: string,
  mines: string,
) {
  await user.click(screen.getByRole('button', { name: '自定义' }));
  expect(await screen.findByLabelText('行数')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('行数'));
  await user.type(screen.getByLabelText('行数'), rows);
  await user.clear(screen.getByLabelText('列数'));
  await user.type(screen.getByLabelText('列数'), columns);
  await user.clear(screen.getByLabelText('雷数'));
  await user.type(screen.getByLabelText('雷数'), mines);
  await user.click(screen.getByRole('button', { name: /开始游戏|重新开局/ }));
}

describe('minesweeper route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('starts a game, analyzes, and copies suggestions', async () => {
    const user = userEvent.setup();
    await renderApp('/game-assist/minesweeper');
    expect(await screen.findByText('扫雷辅助')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(await screen.findByText(/已标 0 \/ 80 雷/)).toBeInTheDocument();

    const cells = screen.getAllByRole('button', { name: /未开/ });
    await user.click(cells[0]);
    await user.click(screen.getByRole('button', { name: '分析' }));

    await waitFor(() => {
      expect(screen.getByText('建议开格')).toBeInTheDocument();
    });
  });

  it('validates custom config and uses the clipboard fallback', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;

    await renderApp('/game-assist/minesweeper');
    await screen.findByText('扫雷辅助');
    await user.click(screen.getByRole('button', { name: '自定义' }));
    await user.clear(screen.getByLabelText('行数'));
    await user.type(screen.getByLabelText('行数'), '2');
    await user.clear(screen.getByLabelText('列数'));
    await user.type(screen.getByLabelText('列数'), '2');
    await user.clear(screen.getByLabelText('雷数'));
    await user.type(screen.getByLabelText('雷数'), '1');
    await user.click(screen.getByRole('button', { name: '开始游戏' }));

    expect(await screen.findByText(/已标 0 \/ 1 雷/)).toBeInTheDocument();

    const cells = screen.getAllByRole('button', { name: /未开/ });
    await user.click(cells[0]);
    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: '分析' }));
    const copyButtons = await screen.findAllByRole('button', { name: '复制' });
    const enabledCopy = copyButtons.find(
      (button) => !(button as HTMLButtonElement).disabled,
    );
    if (enabledCopy) {
      await user.click(enabledCopy);
      await waitFor(() => {
        expect(toast.add).toHaveBeenCalled();
      });
    }
  });

  it('shows a custom config error', async () => {
    const user = userEvent.setup();
    await renderApp('/game-assist/minesweeper');
    await screen.findByText('扫雷辅助');
    await user.click(screen.getByRole('button', { name: '自定义' }));
    expect(await screen.findByLabelText('行数')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('雷数'));
    await user.type(screen.getByLabelText('雷数'), '200');
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(await screen.findByText('雷数必须小于格子总数')).toBeInTheDocument();
  });

  it('plays a small board: flag, keyboard, analyze, apply, and reset', async () => {
    const user = userEvent.setup();
    await renderApp('/game-assist/minesweeper');
    await screen.findByText('扫雷辅助');
    await startCustomGame(user, '3', '3', '8');
    expect(await screen.findByText(/已标 0 \/ 8 雷/)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: '深度分析' }));
    await user.click(screen.getByRole('switch', { name: '深度分析' }));

    const center = await screen.findByRole('button', { name: /22，未开/ });
    await user.click(center);
    expect(
      await screen.findByRole('button', { name: /重置 22/ }),
    ).toBeEnabled();
    for (let i = 0; i < 8; i += 1) {
      await user.click(screen.getByRole('button', { name: /22，/ }));
    }
    fireEvent.keyDown(window, { key: '8' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(screen.getByLabelText('行数'), { key: '3' });

    await user.click(screen.getByRole('button', { name: '分析' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '一键插旗' })).toBeEnabled();
    });
    const copyButtons = screen.getAllByRole('button', { name: '复制' });
    for (const button of copyButtons) {
      if (!(button as HTMLButtonElement).disabled) {
        await user.click(button);
      }
    }
    await user.click(screen.getByRole('button', { name: '一键插旗' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringMatching(/已插旗|没有需要插旗/),
        }),
      );
    });
    await user.click(screen.getByRole('button', { name: '一键插旗' }));
    expect(await screen.findByText('游戏完成')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /22，/ }));
    await user.click(screen.getByRole('button', { name: /重置 22/ }));

    const corner = screen.getByRole('button', { name: /11/ });
    fireEvent.contextMenu(corner);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });
    document.execCommand = vi.fn(() => {
      throw new Error('copy fail');
    });
    await user.click(screen.getByRole('button', { name: '分析' }));
    for (const button of screen.getAllByRole('button', { name: '复制' })) {
      if (!(button as HTMLButtonElement).disabled) {
        await user.click(button);
      }
    }

    await user.clear(screen.getByLabelText('雷数'));
    await user.type(screen.getByLabelText('雷数'), '1');
    await user.click(screen.getByRole('button', { name: '重新开局' }));
    expect(await screen.findByText(/已标 0 \/ 1 雷/)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /22，未开/ }));
    await user.click(screen.getByRole('button', { name: '分析' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '一键点开' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: '一键点开' }));

    await user.click(screen.getByRole('button', { name: '清空棋盘' }));
    expect(await screen.findByText(/已标 0 \/ 1 雷/)).toBeInTheDocument();
  });

  it('starts the hero preset and ignores clipboard when copy text is empty', async () => {
    const user = userEvent.setup();
    await renderApp('/game-assist/minesweeper');
    await screen.findByText('扫雷辅助');
    await user.click(screen.getByRole('button', { name: '英雄' }));
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(await screen.findByText(/已标 0 \/ 42 雷/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '分析' }));
    await screen.findByText('暂时没有确定的下一步');
    expect(screen.getByRole('button', { name: '一键点开' })).toBeDisabled();
  });
});
