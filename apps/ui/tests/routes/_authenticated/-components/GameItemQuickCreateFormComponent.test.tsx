import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameItemQuickCreateFormComponent } from '@/routes/_authenticated/-components/GameItemQuickCreateFormComponent';

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameItemQuickCreateFormComponent', () => {
  it('does not submit an empty name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemQuickCreateFormComponent
          formId="quick-create-form"
          onSubmit={onSubmit}
        />
        <button type="submit" form="quick-create-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请填写物品名称')).toBeInTheDocument();
  });

  it('does not submit a whitespace-only name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemQuickCreateFormComponent
          formId="quick-create-form"
          onSubmit={onSubmit}
        />
        <button type="submit" form="quick-create-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('物品名称'), '   ');
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请填写物品名称')).toBeInTheDocument();
  });

  it('submits trimmed values with default type and quality', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValuesChange = vi.fn();
    render(
      <>
        <GameItemQuickCreateFormComponent
          formId="quick-create-form"
          initialName="  上品玄晶  "
          onSubmit={onSubmit}
          onValuesChange={onValuesChange}
        />
        <button type="submit" form="quick-create-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('物品名称')).toHaveValue('  上品玄晶  ');
    expect(screen.getByRole('combobox', { name: '类型' })).toHaveTextContent(
      '装备',
    );
    expect(screen.getByRole('combobox', { name: '品质' })).toHaveTextContent(
      '紫',
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '上品玄晶',
      type: 'equipment',
      quality: 'purple',
    });
  });

  it('submits selected type and quality and notifies value changes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValuesChange = vi.fn();
    render(
      <>
        <GameItemQuickCreateFormComponent
          formId="quick-create-form"
          onSubmit={onSubmit}
          onValuesChange={onValuesChange}
        />
        <button type="submit" form="quick-create-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('物品名称'), '新掉落');
    expect(onValuesChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: '新掉落' }),
    );

    await chooseSelectOption(user, '类型', '特殊');
    expect(onValuesChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'special' }),
    );

    await chooseSelectOption(user, '品质', '橙');
    expect(onValuesChange).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 'orange' }),
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '新掉落',
      type: 'special',
      quality: 'orange',
    });
  });

  it('clears the name error after typing', async () => {
    const user = userEvent.setup();
    render(
      <>
        <GameItemQuickCreateFormComponent
          formId="quick-create-form"
          onSubmit={vi.fn()}
        />
        <button type="submit" form="quick-create-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(screen.getByText('请填写物品名称')).toBeInTheDocument();
    await user.type(screen.getByLabelText('物品名称'), '玄晶');
    expect(screen.queryByText('请填写物品名称')).not.toBeInTheDocument();
  });

  it('uses provided initial type and quality', () => {
    render(
      <GameItemQuickCreateFormComponent
        formId="quick-create-form"
        initialName="大铁"
        initialType="special"
        initialQuality="orange"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('物品名称')).toHaveValue('大铁');
    expect(screen.getByRole('combobox', { name: '类型' })).toHaveTextContent(
      '特殊',
    );
    expect(screen.getByRole('combobox', { name: '品质' })).toHaveTextContent(
      '橙',
    );
  });

  it('disables fields while pending', () => {
    render(
      <GameItemQuickCreateFormComponent
        formId="quick-create-form"
        pending
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('物品名称')).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '类型' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '品质' })).toBeDisabled();
  });

  it('shows a hint to copy the middle-dot character', () => {
    render(
      <GameItemQuickCreateFormComponent
        formId="quick-create-form"
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    ).toBeInTheDocument();
  });
});
