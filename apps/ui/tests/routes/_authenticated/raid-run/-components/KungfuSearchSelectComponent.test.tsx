import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KungfuSearchSelectComponent } from '@/routes/_authenticated/raid-run/-components/KungfuSearchSelectComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const { listAllKungfus } = vi.hoisted(() => ({
  listAllKungfus: vi.fn(),
}));

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

const kungfus = [
  {
    id: 'kungfu-1',
    name: '紫霞功',
    schoolId: 'school-1',
    schoolName: '纯阳',
    kungfuType: 'attack' as const,
    icon: '/icons/zixia.png',
    alias: ['气纯'],
  },
  {
    id: 'kungfu-2',
    name: '冰心诀',
    schoolId: 'school-2',
    schoolName: '七秀',
    kungfuType: 'heal' as const,
    icon: null,
    alias: [],
  },
];

const waitForEnabledCombobox = async () => {
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeEnabled();
  });
  return screen.getByRole('combobox');
};

describe('KungfuSearchSelectComponent', () => {
  beforeEach(() => {
    listAllKungfus.mockReset();
    listAllKungfus.mockResolvedValue(kungfus);
  });

  it('loads kungfus and selects one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <KungfuSearchSelectComponent
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next?.id);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: /紫霞功/ }));
    expect(onValueChange).toHaveBeenCalledWith({
      id: 'kungfu-1',
      schoolId: 'school-1',
      kungfuType: 'attack',
    });
    expect(combobox).toHaveValue('紫霞功');
  });

  it('filters by name and alias', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <KungfuSearchSelectComponent onValueChange={vi.fn()} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    await user.type(combobox, '冰心');
    expect(
      await screen.findByRole('option', { name: /冰心诀/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /紫霞功/ }),
    ).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '气纯');
    expect(
      await screen.findByRole('option', { name: /紫霞功/ }),
    ).toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '不存在的心法');
    expect(await screen.findByText('未找到心法')).toBeInTheDocument();
  });

  it('clears the value after leaving an empty input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <KungfuSearchSelectComponent
        value="kungfu-1"
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
      <KungfuSearchSelectComponent
        value="kungfu-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '冰心诀');
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith({
        id: 'kungfu-2',
        schoolId: 'school-2',
        kungfuType: 'heal',
      });
    });
  });

  it('reverts unmatched input when leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <KungfuSearchSelectComponent
        value="kungfu-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '少林');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('紫霞功');
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reverts the input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <KungfuSearchSelectComponent
        value="kungfu-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    expect(combobox).toHaveValue('紫霞功');
    await user.clear(combobox);
    await user.type(combobox, '少林');
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('紫霞功');
    });
  });

  it('stays disabled while loading and when disabled', async () => {
    let resolveKungfus: (value: typeof kungfus) => void = () => {};
    listAllKungfus.mockImplementation(
      () =>
        new Promise<typeof kungfus>((resolve) => {
          resolveKungfus = resolve;
        }),
    );

    const { rerender, queryClient } = renderWithQueryClient(
      <KungfuSearchSelectComponent onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();

    resolveKungfus(kungfus);
    await waitForEnabledCombobox();

    rerender(<KungfuSearchSelectComponent disabled onValueChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    queryClient.clear();
  });

  it('shows a load error in the empty state', async () => {
    const user = userEvent.setup();
    listAllKungfus.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(
      <KungfuSearchSelectComponent onValueChange={vi.fn()} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    expect(await screen.findByText('加载心法失败')).toBeInTheDocument();
  });
});
