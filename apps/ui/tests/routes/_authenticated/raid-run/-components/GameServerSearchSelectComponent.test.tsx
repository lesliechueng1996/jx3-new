import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameServerSearchSelectComponent } from '@/routes/_authenticated/raid-run/-components/GameServerSearchSelectComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const { listAllGameServers } = vi.hoisted(() => ({
  listAllGameServers: vi.fn(),
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

const servers = [
  {
    id: 'server-1',
    zone: '电信一区',
    name: '梦江南',
    alias: ['梦岛'],
  },
  {
    id: 'server-2',
    zone: '双线一区',
    name: '绝代天骄',
    alias: [],
  },
];

const waitForEnabledCombobox = async () => {
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeEnabled();
  });
  return screen.getByRole('combobox');
};

describe('GameServerSearchSelectComponent', () => {
  beforeEach(() => {
    listAllGameServers.mockReset();
    listAllGameServers.mockResolvedValue(servers);
  });

  it('loads servers and selects one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <GameServerSearchSelectComponent
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    await user.click(
      await screen.findByRole('option', { name: '电信一区 · 梦江南' }),
    );
    expect(onValueChange).toHaveBeenCalledWith('server-1');
    expect(combobox).toHaveValue('电信一区 · 梦江南');
  });

  it('filters by name and alias', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <GameServerSearchSelectComponent onValueChange={vi.fn()} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    await user.type(combobox, '绝代');
    expect(
      await screen.findByRole('option', { name: '双线一区 · 绝代天骄' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: '电信一区 · 梦江南' }),
    ).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '梦岛');
    expect(
      await screen.findByRole('option', { name: '电信一区 · 梦江南' }),
    ).toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '不存在的服务器');
    expect(await screen.findByText('未找到服务器')).toBeInTheDocument();
  });

  it('clears the value after leaving an empty input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameServerSearchSelectComponent
        value="server-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('selects an exact match after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameServerSearchSelectComponent
        value="server-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '绝代天骄');
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('server-2');
    });
  });

  it('reverts unmatched input when leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameServerSearchSelectComponent
        value="server-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '少林');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('电信一区 · 梦江南');
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reverts the input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameServerSearchSelectComponent
        value="server-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    expect(combobox).toHaveValue('电信一区 · 梦江南');
    await user.clear(combobox);
    await user.type(combobox, '少林');
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('电信一区 · 梦江南');
    });
  });

  it('stays disabled while loading and when disabled', async () => {
    let resolveServers: (value: typeof servers) => void = () => {};
    listAllGameServers.mockImplementation(
      () =>
        new Promise<typeof servers>((resolve) => {
          resolveServers = resolve;
        }),
    );

    const { rerender, queryClient } = renderWithQueryClient(
      <GameServerSearchSelectComponent onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();

    resolveServers(servers);
    await waitForEnabledCombobox();

    rerender(
      <GameServerSearchSelectComponent disabled onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
    queryClient.clear();
  });

  it('shows a load error in the empty state', async () => {
    const user = userEvent.setup();
    listAllGameServers.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(
      <GameServerSearchSelectComponent onValueChange={vi.fn()} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    expect(await screen.findByText('加载服务器失败')).toBeInTheDocument();
  });
});
