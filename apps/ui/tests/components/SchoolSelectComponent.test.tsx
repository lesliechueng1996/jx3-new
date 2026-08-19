import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchoolSelectComponent } from '@/components/SchoolSelectComponent';
import { renderWithQueryClient } from '../helpers/render';

const { listAllSchools } = vi.hoisted(() => ({
  listAllSchools: vi.fn(),
}));

vi.mock('@/lib/api/schools-api', () => ({
  schoolsAllQueryKey: ['schools-all'],
  listAllSchools,
}));

const schools = [
  {
    id: 'school-1',
    name: '纯阳',
    type: 'school' as const,
    icon: null,
    alias: ['纯阳宫'],
  },
  {
    id: 'school-2',
    name: '天策',
    type: 'school' as const,
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

describe('SchoolSelectComponent', () => {
  beforeEach(() => {
    listAllSchools.mockReset();
    listAllSchools.mockResolvedValue(schools);
  });

  it('loads schools and selects one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <SchoolSelectComponent
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
    await user.click(await screen.findByRole('option', { name: '纯阳' }));
    expect(onValueChange).toHaveBeenCalledWith('school-1');
    expect(combobox).toHaveValue('纯阳');
  });

  it('filters by name and alias', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SchoolSelectComponent onValueChange={vi.fn()} />);

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    await user.type(combobox, '天策');
    expect(
      await screen.findByRole('option', { name: '天策' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: '纯阳' }),
    ).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '纯阳宫');
    expect(
      await screen.findByRole('option', { name: '纯阳' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: '天策' }),
    ).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, '不存在的门派');
    expect(await screen.findByText('未找到门派')).toBeInTheDocument();
  });

  it('does not commit while typing and commits after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <SchoolSelectComponent
        allowEmpty
        value="school-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    expect(combobox).toHaveValue('纯阳');
    await user.clear(combobox);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(combobox).toHaveValue('');

    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('reverts unmatched input when leaving a required select', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <SchoolSelectComponent value="school-1" onValueChange={onValueChange} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '少林');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('纯阳');
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('selects an exact match after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <SchoolSelectComponent value="school-1" onValueChange={onValueChange} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.type(combobox, '天策');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('school-2');
    });
  });

  it('reverts the input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <SchoolSelectComponent value="school-1" onValueChange={onValueChange} />,
    );

    const combobox = await waitForEnabledCombobox();
    await user.clear(combobox);
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('纯阳');
    });
  });

  it('can clear the value with the empty option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <SchoolSelectComponent
        allowEmpty
        value="school-1"
        onValueChange={onValueChange}
      />,
    );

    const combobox = await waitForEnabledCombobox();
    expect(combobox).toHaveValue('纯阳');
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: '全部' }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('stays disabled while loading and when disabled', async () => {
    let resolveSchools: (value: typeof schools) => void = () => {};
    listAllSchools.mockImplementation(
      () =>
        new Promise<typeof schools>((resolve) => {
          resolveSchools = resolve;
        }),
    );

    const { rerender, queryClient } = renderWithQueryClient(
      <SchoolSelectComponent onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();

    resolveSchools(schools);
    await waitForEnabledCombobox();

    rerender(<SchoolSelectComponent disabled onValueChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    queryClient.clear();
  });

  it('shows a load error in the empty state', async () => {
    const user = userEvent.setup();
    listAllSchools.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(<SchoolSelectComponent onValueChange={vi.fn()} />);

    const combobox = await waitForEnabledCombobox();
    await user.click(combobox);
    expect(await screen.findByText('加载门派失败')).toBeInTheDocument();
  });
});
