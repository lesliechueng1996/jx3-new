import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameExpansionFormComponent } from '@/routes/_authenticated/admin/game-expansions/-components/GameExpansionFormComponent';

const emptyValues = {
  name: '',
  level: '',
  description: '',
  startDate: '',
  endDate: '',
};

describe('GameExpansionFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameExpansionFormComponent
          formId="expansion-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="expansion-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
    expect(screen.getByText('请输入等级')).toBeInTheDocument();
    expect(screen.getByText('请选择起始日期')).toBeInTheDocument();
  });

  it('submits values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameExpansionFormComponent
          formId="expansion-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="expansion-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '江湖');
    await user.type(screen.getByLabelText('等级'), '120');
    await user.type(screen.getByLabelText('描述'), '描述');
    fireEvent.change(screen.getByLabelText('起始日期'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.change(screen.getByLabelText('终止日期'), {
      target: { value: '2024-12-31' },
    });
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '江湖',
      level: '120',
      description: '描述',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
  });

  it('shows length errors and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameExpansionFormComponent
          formId="expansion-form"
          initialValues={{
            name: 'x'.repeat(65),
            level: '201',
            description: 'x'.repeat(2001),
            startDate: '2024-06-01',
            endDate: '2024-01-01',
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="expansion-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('名称')).toBeDisabled();
    expect(screen.getByLabelText('等级')).toBeDisabled();
    expect(screen.getByLabelText('描述')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('名称最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('等级须为 1-200')).toBeInTheDocument();
    expect(screen.getByText('描述最多 2000 个字符')).toBeInTheDocument();
    expect(screen.getByText('起始日期不能晚于终止日期')).toBeInTheDocument();
  });
});
