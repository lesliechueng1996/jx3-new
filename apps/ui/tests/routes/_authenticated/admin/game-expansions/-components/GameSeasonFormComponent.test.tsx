import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameSeasonFormComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameSeasonFormComponent';

const emptyValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  sortOrder: '',
};

describe('GameSeasonFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameSeasonFormComponent
          formId="season-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="season-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
    expect(screen.getByText('请选择起始日期')).toBeInTheDocument();
    expect(screen.getByText('请输入排序')).toBeInTheDocument();
  });

  it('submits values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameSeasonFormComponent
          formId="season-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="season-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), 'S1');
    await user.type(screen.getByLabelText('描述'), '描述');
    fireEvent.change(screen.getByLabelText('起始日期'), {
      target: { value: '2024-06-01' },
    });
    fireEvent.change(screen.getByLabelText('终止日期'), {
      target: { value: '2024-12-31' },
    });
    await user.type(screen.getByLabelText('排序'), '1');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'S1',
      description: '描述',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      sortOrder: '1',
    });
  });

  it('shows errors and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameSeasonFormComponent
          formId="season-form"
          initialValues={{
            name: 'x'.repeat(65),
            description: 'x'.repeat(2001),
            startDate: '2024-06-01',
            endDate: '2024-01-01',
            sortOrder: '1.5',
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="season-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('名称')).toBeDisabled();
    expect(screen.getByLabelText('描述')).toBeDisabled();
    expect(screen.getByLabelText('排序')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('名称最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('描述最多 2000 个字符')).toBeInTheDocument();
    expect(screen.getByText('起始日期不能晚于终止日期')).toBeInTheDocument();
    expect(screen.getByText('排序须为整数')).toBeInTheDocument();
  });
});
