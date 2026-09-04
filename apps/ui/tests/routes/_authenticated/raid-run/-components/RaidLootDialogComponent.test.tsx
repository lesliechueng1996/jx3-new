import { screen, within } from '@testing-library/react';
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

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

const openCreatePanel = async (
  user: ReturnType<typeof userEvent.setup>,
  name = '新掉落',
) => {
  searchGameItems.mockResolvedValue([]);
  const itemInput = screen.getByLabelText('物品');
  await user.click(itemInput);
  await user.type(itemInput, name);
  await user.click(await waitForOption(`创建【${name}】`));
  return screen.getByRole('group', { name: '创建新物品' });
};

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

    expect(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    ).toBeInTheDocument();

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

    const itemInput = screen.getByLabelText('物品');
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

  it('shows the create panel after choosing create', async () => {
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

    const panel = await openCreatePanel(user);
    expect(within(panel).getByLabelText('物品名称')).toHaveValue('新掉落');
    expect(screen.getByRole('combobox', { name: '类型' })).toHaveTextContent(
      '装备',
    );
    expect(screen.getByRole('combobox', { name: '品质' })).toHaveTextContent(
      '紫',
    );
    expect(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    ).toBeInTheDocument();

    await chooseSelectOption(user, '类型', '特殊');
    await chooseSelectOption(user, '品质', '橙');
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

  it('confirms create and select then submits', async () => {
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

    const panel = await openCreatePanel(user);
    await user.clear(within(panel).getByLabelText('物品名称'));
    await user.type(within(panel).getByLabelText('物品名称'), ' 自定义掉落 ');
    await user.click(screen.getByRole('button', { name: '创建并选择' }));
    expect(
      screen.queryByRole('group', { name: '创建新物品' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('物品')).toHaveValue('自定义掉落');

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        createName: '自定义掉落',
        createType: 'equipment',
        createQuality: 'purple',
      }),
    );
  });

  it('requires a name before create and select', async () => {
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

    const panel = await openCreatePanel(user);
    await user.clear(within(panel).getByLabelText('物品名称'));
    await user.click(screen.getByRole('button', { name: '创建并选择' }));
    expect(screen.getByText('请填写物品名称')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: '创建新物品' }),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels the create panel', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const panel = await openCreatePanel(user);
    await user.click(within(panel).getByRole('button', { name: '取消' }));
    expect(
      screen.queryByRole('group', { name: '创建新物品' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('物品')).toHaveValue('');
  });

  it('closes the create panel after selecting an existing item', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RaidLootDialogComponent
        open
        pending={false}
        title="添加掉落"
        winnerOptions={[]}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await openCreatePanel(user);
    searchGameItems.mockResolvedValue(items);
    const itemInput = screen.getByLabelText('物品');
    await user.clear(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await waitForOption('上品玄晶'));
    expect(
      screen.queryByRole('group', { name: '创建新物品' }),
    ).not.toBeInTheDocument();
    expect(itemInput).toHaveValue('上品玄晶');
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

    expect(screen.getByLabelText('物品')).toHaveValue('上品玄晶');
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

    const itemInput = screen.getByLabelText('物品');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await waitForOption('上品玄晶'));
    await user.type(screen.getByLabelText('数量'), 'a');
    expect(screen.getByLabelText('数量')).toHaveValue('1');
    await user.clear(screen.getByLabelText('数量'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('数量须为大于0的整数')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits default type and quality after create', async () => {
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

    await openCreatePanel(user);
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

    const itemInput = screen.getByLabelText('物品');
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

    expect(screen.getByLabelText('物品')).toHaveValue('');
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
