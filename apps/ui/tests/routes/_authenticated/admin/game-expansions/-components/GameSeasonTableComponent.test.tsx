import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameExpansionListItem } from '@/lib/api/admin/admin-game-expansions-api';
import type { AdminGameSeasonListItem } from '@/lib/api/admin/admin-game-seasons-api';
import { GameSeasonTableComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameSeasonTableComponent';

const expansion: AdminGameExpansionListItem = {
  id: 'exp-1',
  name: '江湖',
  description: null,
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const season: AdminGameSeasonListItem = {
  id: '1',
  expansionId: 'exp-1',
  name: 'S1',
  description: '描述',
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameSeasonTableComponent', () => {
  it('shows an empty state and the date hint', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <GameSeasonTableComponent
        expansion={expansion}
        items={[]}
        pendingSeasonId={null}
        onCreate={onCreate}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无赛季数据')).toBeInTheDocument();
    expect(
      screen.getByText(/赛季日期必须落在所属资料片的日期范围内/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '新增赛季' }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('edits and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GameSeasonTableComponent
        expansion={expansion}
        items={[
          season,
          {
            ...season,
            id: '2',
            name: 'S2',
            description: null,
            endDate: null,
          },
        ]}
        pendingSeasonId="2"
        onCreate={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getAllByText('描述').length).toBeGreaterThan(0);
    expect(screen.getByText('2024-06-01 ~ 2024-12-31')).toBeInTheDocument();
    expect(screen.getByText('2024-06-01 ~ 进行中')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(season);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(season);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <GameSeasonTableComponent
        expansion={expansion}
        items={[]}
        isLoading
        pendingSeasonId={null}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
