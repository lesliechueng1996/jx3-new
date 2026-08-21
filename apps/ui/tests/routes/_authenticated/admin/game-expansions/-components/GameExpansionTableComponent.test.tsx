import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameExpansionListItem } from '@/lib/api/admin/admin-game-expansions-api';
import { GameExpansionTableComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameExpansionTableComponent';

const expansion: AdminGameExpansionListItem = {
  id: '1',
  name: '江湖',
  description: '描述',
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameExpansionTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <GameExpansionTableComponent
        items={[]}
        pendingExpansionId={null}
        expandedExpansionId={null}
        onToggleExpand={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        renderExpanded={() => null}
      />,
    );
    expect(screen.getByText('暂无资料片数据')).toBeInTheDocument();
  });

  it('edits, deletes, expands, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggleExpand = vi.fn();

    render(
      <GameExpansionTableComponent
        items={[
          expansion,
          {
            ...expansion,
            id: '2',
            name: '进行中',
            description: null,
            endDate: null,
          },
        ]}
        pendingExpansionId="2"
        expandedExpansionId="1"
        onToggleExpand={onToggleExpand}
        onEdit={onEdit}
        onDelete={onDelete}
        renderExpanded={(item) => <div>赛季：{item.name}</div>}
      />,
    );

    expect(screen.getByText('江湖')).toBeInTheDocument();
    expect(screen.getAllByText('描述').length).toBeGreaterThan(0);
    expect(screen.getByText('2024-01-01 ~ 2025-12-31')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01 ~ 进行中')).toBeInTheDocument();
    expect(screen.getByText('赛季：江湖')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(expansion);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(expansion);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '收起赛季' }));
    expect(onToggleExpand).toHaveBeenCalledWith(expansion);
    await user.click(screen.getByRole('button', { name: '展开赛季' }));
    expect(onToggleExpand).toHaveBeenCalledTimes(2);
  });

  it('shows a loading overlay', () => {
    render(
      <GameExpansionTableComponent
        items={[]}
        isLoading
        pendingExpansionId={null}
        expandedExpansionId={null}
        onToggleExpand={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        renderExpanded={() => null}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
