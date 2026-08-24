import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import RaidLootPanel from '@/routes/_authenticated/raid-run/-components/RaidLootPanel';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { renderWithQueryClient } from '../../../../helpers/render';

const { updateRaidRunGameRaidId, updateRaidRunWages } = vi.hoisted(() => ({
  updateRaidRunGameRaidId: vi.fn(),
  updateRaidRunWages: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  updateRaidRunGameRaidId,
  updateRaidRunWages,
}));

describe('RaidLootPanel', () => {
  beforeEach(() => {
    updateRaidRunGameRaidId.mockReset();
    updateRaidRunWages.mockReset();
    vi.mocked(toast.add).mockClear();
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1' }),
      selectedSlot: null,
    });
  });

  it('shows placeholders and records a game raid id', async () => {
    const user = userEvent.setup();
    updateRaidRunGameRaidId.mockResolvedValue({ gameRaidId: 'game-9' });
    renderWithQueryClient(<RaidLootPanel className="min-w-0" />);

    expect(screen.getByText('掉落物品')).toBeInTheDocument();
    expect(screen.getByText('游戏副本ID：未记录')).toBeInTheDocument();
    expect(
      screen.getByText('工资详情：金团工资 0金，团队补贴 0金，个人工资 0金'),
    ).toBeInTheDocument();
    expect(screen.getByText('暂无掉落')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '记录副本ID' }));
    await user.type(screen.getByLabelText('游戏副本ID'), 'game-9');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateRaidRunGameRaidId).toHaveBeenCalledWith('run-1', 'game-9');
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '游戏副本ID已记录',
    });
    expect(useRaidRun.getState().raidRun.gameRaidId).toBe('game-9');
    expect(screen.getByText('游戏副本ID：game-9')).toBeInTheDocument();
  });

  it('records wages and shows formatted amounts', async () => {
    const user = userEvent.setup();
    useRaidRun.setState({
      raidRun: createRaidRun({
        id: 'run-1',
        gameRaidId: 'in-game',
        totalIncome: 15000,
        subsidyAmount: 2000,
        wagePerPerson: 1300,
      }),
      selectedSlot: null,
    });
    updateRaidRunWages.mockResolvedValue({
      totalIncome: 20000,
      subsidyAmount: 0,
      wagePerPerson: 800,
    });

    renderWithQueryClient(<RaidLootPanel />);

    expect(screen.getByText('游戏副本ID：in-game')).toBeInTheDocument();
    expect(
      screen.getByText(
        '工资详情：金团工资 1砖5000金，团队补贴 2000金，个人工资 1300金',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '记录工资' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateRaidRunWages).toHaveBeenCalled();
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '工资已记录',
    });
    expect(useRaidRun.getState().raidRun.totalIncome).toBe(20000);
    expect(useRaidRun.getState().raidRun.wagePerPerson).toBe(800);
  });

  it('treats a blank game raid id as missing', () => {
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1', gameRaidId: '  ' }),
      selectedSlot: null,
    });
    renderWithQueryClient(<RaidLootPanel />);
    expect(screen.getByText('游戏副本ID：未记录')).toBeInTheDocument();
  });

  it('toasts API errors', async () => {
    const user = userEvent.setup();
    updateRaidRunGameRaidId.mockRejectedValue(new Error('副本失败'));
    updateRaidRunWages.mockRejectedValue(new Error('工资失败'));
    renderWithQueryClient(<RaidLootPanel />);

    await user.click(screen.getByRole('button', { name: '记录副本ID' }));
    await user.type(screen.getByLabelText('游戏副本ID'), 'game-9');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '副本失败',
      });
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '记录工资' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '工资失败',
      });
    });
  });
});
