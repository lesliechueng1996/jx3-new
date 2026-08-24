import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaidLootDialogComponent } from '@/routes/_authenticated/raid-run/-components/RaidLootDialogComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const { searchGameItems } = vi.hoisted(() => ({
  searchGameItems: vi.fn(),
}));

vi.mock('@/lib/api/game-items-api', () => ({
  gameItemsSearchQueryKey: (name: string) => ['game-items-search', name],
  searchGameItems,
}));

const items = [
  {
    id: 'item-1',
    name: '上品玄晶',
    type: 'special' as const,
    quality: 'orange' as const,
    icon: '/icons/xuanjing.png',
    alias: ['大铁'],
  },
];

const waitForOption = (name: string) => screen.findByRole('option', { name });

describe('RaidLootDialogComponent', () => {
  beforeEach(() => {
    searchGameItems.mockReset();
    searchGameItems.mockResolvedValue(items);
  });

  it('validates a missing item', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('请选择物品')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a selected item', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[{ id: 's1', characterName: '团长' }]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const itemInput = screen.getByLabelText('物品名称');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await waitForOption('上品玄晶'));
    await user.click(screen.getByLabelText('获得者'));
    await user.click(await screen.findByRole('option', { name: '团长' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'item-1',
        createName: undefined,
        quantity: 1,
        winnerSignupId: 's1',
        price: null,
      }),
    );
  });

  it('shows type and quality after choosing create', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    searchGameItems.mockResolvedValue([]);
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const itemInput = screen.getByLabelText('物品名称');
    await user.click(itemInput);
    await user.type(itemInput, '新掉落');
    await user.click(await waitForOption('创建【新掉落】'));
    expect(screen.getByText('类型')).toBeInTheDocument();
    expect(screen.getByText('品质')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '装备' })).toHaveAttribute(
      'data-pressed',
    );
    expect(screen.getByRole('button', { name: '紫' })).toHaveAttribute(
      'data-pressed',
    );

    await user.click(screen.getByRole('button', { name: '特殊' }));
    await user.click(screen.getByRole('button', { name: '橙' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: undefined,
        createName: '新掉落',
        createType: 'special',
        createQuality: 'orange',
        quantity: 1,
      }),
    );
  });

  it('seeds an existing loot for edit', () => {
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending
        title="编辑掉落"
        winnerOptions={[]}
        initial={{
          itemId: 'item-1',
          itemName: '上品玄晶',
          itemType: 'special',
          itemQuality: 'orange',
          itemIcon: '/icons/xuanjing.png',
          quantity: 3,
          winnerSignupId: null,
          price: 20000,
          remark: '备注',
        }}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('物品名称')).toHaveValue('上品玄晶');
    expect(screen.getByLabelText('数量')).toHaveValue('3');
    expect(screen.getByLabelText('备注')).toHaveValue('备注');
    expect(screen.getByRole('button', { name: /保存/ })).toBeDisabled();
  });

  it('validates an empty quantity', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const itemInput = screen.getByLabelText('物品名称');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await waitForOption('上品玄晶'));
    await user.clear(screen.getByLabelText('数量'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('数量须为大于0的整数')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps type and quality when a toggle is cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    searchGameItems.mockResolvedValue([]);
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const itemInput = screen.getByLabelText('物品名称');
    await user.click(itemInput);
    await user.type(itemInput, '新掉落');
    await user.click(await waitForOption('创建【新掉落】'));
    await user.click(screen.getByRole('button', { name: '装备' }));
    await user.click(screen.getByRole('button', { name: '紫' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        createType: 'equipment',
        createQuality: 'purple',
      }),
    );
  });

  it('submits price and trims remark', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const itemInput = screen.getByLabelText('物品名称');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await waitForOption('上品玄晶'));
    await user.type(screen.getByLabelText('成交价格'), '1');
    await user.type(screen.getByLabelText('备注'), '  首刀  ');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'item-1',
        price: 10000,
        remark: '首刀',
      }),
    );
  });

  it('seeds loot without an item name', () => {
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="编辑掉落"
        winnerOptions={[]}
        initial={{
          itemId: 'item-1',
          quantity: 1,
          winnerSignupId: null,
          price: null,
          remark: null,
        }}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('物品名称')).toHaveValue('');
  });

  it('closes from cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
