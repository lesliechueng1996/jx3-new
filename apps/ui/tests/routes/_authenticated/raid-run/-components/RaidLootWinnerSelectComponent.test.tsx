import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RaidLootWinnerSelectComponent } from '@/routes/_authenticated/raid-run/-components/RaidLootWinnerSelectComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const options = [
  { id: 's1', characterName: '团长', serverName: '破阵子' },
  { id: 's2', characterName: '老板' },
];

describe('RaidLootWinnerSelectComponent', () => {
  it('shows an empty roster message', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RaidLootWinnerSelectComponent options={[]} onValueChange={vi.fn()} />,
    );
    await user.click(screen.getByLabelText('获得者'));
    expect(await screen.findByText('暂无可选角色')).toBeInTheDocument();
  });

  it('filters and selects a winner, then clears on empty blur', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string>();
      return (
        <RaidLootWinnerSelectComponent
          value={value}
          options={options}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('获得者');
    await user.click(combobox);
    await user.type(combobox, '团');
    expect(
      await screen.findByRole('option', { name: '团长 · 破阵子' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: '团长 · 破阵子' }));
    expect(onValueChange).toHaveBeenCalledWith('s1');
    expect(combobox).toHaveValue('团长 · 破阵子');

    await user.clear(combobox);
    await user.tab();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('commits an exact name on blur and reverts unmatched input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string>();
      return (
        <RaidLootWinnerSelectComponent
          value={value}
          options={options}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('获得者');
    await user.click(combobox);
    await user.type(combobox, '老板');
    await user.tab();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('s2');
    });
    expect(combobox).toHaveValue('老板');

    await user.clear(combobox);
    await user.type(combobox, '没有这个');
    await user.tab();
    await waitFor(() => {
      expect(combobox).toHaveValue('老板');
    });
  });

  it('restores the selected winner after escape', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState<string>();
      return (
        <RaidLootWinnerSelectComponent
          value={value}
          options={options}
          onValueChange={setValue}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('获得者');
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: '老板' }));
    expect(combobox).toHaveValue('老板');

    await user.click(combobox);
    await user.clear(combobox);
    await user.type(combobox, '没有');
    expect(await screen.findByText('未找到角色')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(combobox).toHaveValue('老板');
    });
  });

  it('shows no match when the filter misses', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RaidLootWinnerSelectComponent
        options={options}
        onValueChange={vi.fn()}
      />,
    );
    const combobox = screen.getByLabelText('获得者');
    await user.click(combobox);
    await user.type(combobox, '没有');
    expect(await screen.findByText('未找到角色')).toBeInTheDocument();
  });
});
