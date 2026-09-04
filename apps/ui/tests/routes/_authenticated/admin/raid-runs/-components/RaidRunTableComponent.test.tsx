import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminRaidRunListItem } from '@/lib/api/admin/admin-raid-runs-api';
import { RaidRunTableComponent } from '@/routes/_authenticated/admin/raid-runs/-components/RaidRunTableComponent';

const raidRun: AdminRaidRunListItem = {
  id: '1',
  name: '周六团',
  status: 'pending',
  gameRaidId: 'game-1',
  dungeonId: 'dungeon-1',
  dungeonName: '25人英雄河阳之战',
  startTime: '2026-08-22 21:00',
  endTime: '2026-08-23 00:00',
  reservedTank: 1,
  reservedHealer: 2,
  reservedDps: 20,
  reservedBoss: 2,
  totalIncome: 15000,
  wagePerPerson: 1300,
  subsidyAmount: 2000,
  signupCount: 25,
};

describe('RaidRunTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <RaidRunTableComponent
        items={[]}
        pendingRaidRunId={null}
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无开团数据')).toBeInTheDocument();
  });

  it('edits, copies, and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onCopy = vi.fn();
    const onDelete = vi.fn();

    render(
      <RaidRunTableComponent
        items={[
          raidRun,
          {
            ...raidRun,
            id: '2',
            name: '周日团',
            status: 'recruiting',
            gameRaidId: null,
            dungeonName: null,
            endTime: null,
            reservedTank: 0,
            reservedHealer: 0,
            reservedDps: 0,
            reservedBoss: 0,
          },
        ]}
        pendingRaidRunId="2"
        onEdit={onEdit}
        onCopy={onCopy}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('待开始')).toBeInTheDocument();
    expect(screen.getByText('招募中')).toBeInTheDocument();
    expect(screen.getByText('T1 / H2 / D20 / B2')).toBeInTheDocument();
    expect(screen.getByText('25人英雄河阳之战')).toBeInTheDocument();
    expect(screen.getAllByText('2026-08-22 21:00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('周六').length).toBe(2);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(raidRun);
    await user.click(screen.getAllByRole('button', { name: '复制' })[0]);
    expect(onCopy).toHaveBeenCalledWith(raidRun);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(raidRun);
    expect(screen.getAllByRole('button', { name: '复制' })[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <RaidRunTableComponent
        items={[]}
        isLoading
        pendingRaidRunId={null}
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
