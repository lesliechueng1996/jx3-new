import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaidSignupCharacterSearchSelectComponent } from '@/routes/_authenticated/raid-run/-components/RaidSignupCharacterSearchSelectComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const { searchRaidSignups } = vi.hoisted(() => ({
  searchRaidSignups: vi.fn(),
}));

vi.mock('@/lib/api/raid-signups-api', () => ({
  raidSignupsSearchQueryKey: (name: string) => ['raid-signups-search', name],
  searchRaidSignups,
}));

const signups = [
  {
    id: 'signup-1',
    characterName: '少侠甲',
    serverId: 'server-1',
    serverName: '梦江南',
    kungfuId: 'kungfu-1',
    kungfuName: '紫霞功',
    schoolId: 'school-1',
    kungfuType: 'attack' as const,
  },
  {
    id: 'signup-2',
    characterName: '少侠乙',
    serverId: null,
    serverName: null,
    kungfuId: null,
    kungfuName: null,
    schoolId: null,
    kungfuType: null,
  },
];

describe('RaidSignupCharacterSearchSelectComponent', () => {
  beforeEach(() => {
    searchRaidSignups.mockReset();
    searchRaidSignups.mockResolvedValue(signups);
  });

  it('searches and selects a historical character', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState('');
      return (
        <RaidSignupCharacterSearchSelectComponent
          debounceMs={0}
          value={value}
          onInputValueChange={(next) => {
            onInputValueChange(next);
            setValue(next);
          }}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next.characterName);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('角色名');
    await user.click(combobox);
    expect(await screen.findByText('请输入角色名')).toBeInTheDocument();

    await user.type(combobox, '少侠');
    expect(
      await screen.findByRole('option', {
        name: '少侠甲 · 梦江南 · 紫霞功',
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('option', { name: '少侠甲 · 梦江南 · 紫霞功' }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'signup-1',
        characterName: '少侠甲',
        serverId: 'server-1',
        kungfuId: 'kungfu-1',
      }),
    );
    await waitFor(() => {
      expect(combobox).toHaveValue('少侠甲');
    });
  });

  it('shows pending, empty, and error states', async () => {
    const user = userEvent.setup();
    let resolveSearch: (value: typeof signups) => void = () => {};
    searchRaidSignups.mockImplementation(
      () =>
        new Promise<typeof signups>((resolve) => {
          resolveSearch = resolve;
        }),
    );

    renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    const combobox = screen.getByLabelText('角色名');
    await user.click(combobox);
    await user.type(combobox, '少侠');
    expect(await screen.findByText('搜索中...')).toBeInTheDocument();
    resolveSearch([]);
    expect(await screen.findByText('未找到历史角色')).toBeInTheDocument();

    searchRaidSignups.mockRejectedValue(new Error('fail'));
    await user.clear(combobox);
    await user.type(combobox, '失败');
    expect(await screen.findByText('搜索角色名失败')).toBeInTheDocument();
  });

  it('keeps free-text input after blur when nothing is selected', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    searchRaidSignups.mockResolvedValue([]);

    renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        onInputValueChange={onInputValueChange}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByLabelText('角色名');
    await user.type(combobox, '新角色');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('新角色');
    });
    expect(onInputValueChange).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps typed input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        value="少侠甲"
        onInputValueChange={vi.fn()}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByLabelText('角色名');
    await waitFor(() => {
      expect(combobox).toHaveValue('少侠甲');
    });
    await user.clear(combobox);
    await user.type(combobox, '临时名');
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('clears the selected suggestion when the parent name changes', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState('');
      return (
        <>
          <button type="button" onClick={() => setValue('其他')}>
            改名
          </button>
          <RaidSignupCharacterSearchSelectComponent
            debounceMs={0}
            value={value}
            onInputValueChange={setValue}
            onValueChange={(item) => setValue(item.characterName)}
          />
        </>
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('角色名');
    await user.type(combobox, '少侠');
    await user.click(
      await screen.findByRole('option', { name: '少侠甲 · 梦江南 · 紫霞功' }),
    );
    expect(combobox).toHaveValue('少侠甲');

    await user.click(screen.getByRole('button', { name: '改名' }));
    expect(combobox).toHaveValue('其他');
  });

  it('syncs from the parent value when not focused', async () => {
    const { rerender } = renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        value="少侠甲"
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByLabelText('角色名');
    expect(combobox).toHaveValue('少侠甲');

    rerender(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        value="少侠乙"
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    expect(combobox).toHaveValue('少侠乙');
  });

  it('does not overwrite typed input when focused parent value changes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        value=""
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByLabelText('角色名');
    await user.click(combobox);
    await user.type(combobox, '正在输入');

    rerender(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        value="外部值"
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    expect(combobox).toHaveValue('正在输入');
  });

  it('does not search when the query is longer than 64 characters', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        debounceMs={0}
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByLabelText('角色名');
    await user.click(combobox);
    await user.type(combobox, 'a'.repeat(65));
    expect(await screen.findByText('未找到历史角色')).toBeInTheDocument();
    expect(searchRaidSignups).not.toHaveBeenCalledWith('a'.repeat(65));
  });

  it('stays disabled when disabled', () => {
    renderWithQueryClient(
      <RaidSignupCharacterSearchSelectComponent
        disabled
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('角色名')).toBeDisabled();
  });
});
