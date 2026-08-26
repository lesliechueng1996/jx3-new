import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RaidSignupFilterSelectComponent } from '@/routes/_authenticated/admin/raid-signups/-components/RaidSignupFilterSelectComponent';
import { formatGameServerFilterLabel } from '@/routes/_authenticated/admin/raid-signups/-lib/raid-signups-filter-select';
import { renderWithQueryClient } from '../../../../../helpers/render';

const servers = [
  {
    id: 'server-1',
    zone: '电信',
    name: '梦江南',
    alias: ['双梦'],
  },
  {
    id: 'server-2',
    zone: '网通',
    name: '长安',
    alias: [] as string[],
  },
];

describe('RaidSignupFilterSelectComponent', () => {
  it('selects an item and can clear with the empty option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>('server-1');
      return (
        <RaidSignupFilterSelectComponent
          value={value}
          items={servers}
          placeholder="选择区服"
          emptyMessage="未找到区服"
          loadingMessage="加载中..."
          errorMessage="加载区服失败"
          itemLabel={formatGameServerFilterLabel}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveValue('电信 · 梦江南');
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: '全部' }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('does not commit while typing and commits after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        value="server-1"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.clear(combobox);
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('reverts unmatched input and escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        value="server-1"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.clear(combobox);
    await user.type(combobox, '不存在');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('电信 · 梦江南');
    });
    expect(onValueChange).not.toHaveBeenCalled();

    await user.clear(combobox);
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('电信 · 梦江南');
    });
  });

  it('selects an exact match after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        value="server-1"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.clear(combobox);
    await user.type(combobox, '长安');
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('server-2');
    });
  });

  it('keeps typed input while focused when the value prop changes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        value="server-1"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.clear(combobox);
    await user.type(combobox, '输入中');
    rerender(
      <RaidSignupFilterSelectComponent
        value="server-2"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={vi.fn()}
      />,
    );
    expect(combobox).toHaveValue('输入中');
  });

  it('shows loading and error empty states', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        items={[]}
        isPending
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();

    rerender(
      <RaidSignupFilterSelectComponent
        items={[]}
        isError
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        onValueChange={vi.fn()}
      />,
    );
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeEnabled();
    await user.click(combobox);
    expect(await screen.findByText('加载区服失败')).toBeInTheDocument();
  });

  it('commits when the popup closes without escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        value="server-1"
        items={servers}
        placeholder="选择区服"
        emptyMessage="未找到区服"
        loadingMessage="加载中..."
        errorMessage="加载区服失败"
        itemLabel={formatGameServerFilterLabel}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.clear(combobox);
    await user.click(document.body);
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('uses the item name when no label formatter is given', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupFilterSelectComponent
        items={[{ id: 'kungfu-1', name: '紫霞功', alias: [] }]}
        placeholder="选择心法"
        emptyMessage="未找到心法"
        loadingMessage="加载中..."
        errorMessage="加载心法失败"
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: '紫霞功' }));
    expect(onValueChange).toHaveBeenCalledWith('kungfu-1');
  });
});
