import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecordWageDialogComponent } from '@/routes/_authenticated/raid-run/-components/RecordWageDialogComponent';

const goldInput = (id: string) => document.getElementById(id) as HTMLElement;

describe('RecordWageDialogComponent', () => {
  it('recalculates personal wage and allows a manual override', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <RecordWageDialogComponent
        open
        pending={false}
        initialWages={{
          totalIncome: 15000,
          subsidyAmount: 2000,
          wagePerPerson: 1300,
        }}
        wageShareCount={10}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('金团工资')).toHaveValue('1');
    expect(goldInput('raid-run-total-income-gold')).toHaveValue('5000');
    expect(screen.getByLabelText('个人工资')).toHaveValue('');
    expect(goldInput('raid-run-wage-per-person-gold')).toHaveValue('1300');

    fireEvent.change(screen.getByLabelText('金团工资'), {
      target: { value: '2' },
    });
    fireEvent.change(goldInput('raid-run-total-income-gold'), {
      target: { value: '' },
    });
    expect(goldInput('raid-run-wage-per-person-gold')).toHaveValue('1800');

    fireEvent.change(screen.getByLabelText('团队补贴'), {
      target: { value: '1' },
    });
    fireEvent.change(goldInput('raid-run-subsidy-amount-gold'), {
      target: { value: '' },
    });
    expect(goldInput('raid-run-wage-per-person-gold')).toHaveValue('1000');

    fireEvent.change(screen.getByLabelText('个人工资'), {
      target: { value: '3' },
    });
    fireEvent.change(goldInput('raid-run-wage-per-person-gold'), {
      target: { value: '' },
    });
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      totalIncome: 20000,
      subsidyAmount: 10000,
      wagePerPerson: 30000,
    });
  });

  it('rejects a subsidy greater than total income and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <RecordWageDialogComponent
        open
        pending={false}
        initialWages={{
          totalIncome: 1000,
          subsidyAmount: 0,
          wagePerPerson: 0,
        }}
        wageShareCount={1}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(goldInput('raid-run-subsidy-amount-gold'), {
      target: { value: '2000' },
    });
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('团队补贴不能大于金团工资')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(goldInput('raid-run-subsidy-amount-gold'), {
      target: { value: '0' },
    });
    expect(
      screen.queryByText('团队补贴不能大于金团工资'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <RecordWageDialogComponent
        open
        pending
        initialWages={{
          totalIncome: 0,
          subsidyAmount: 0,
          wagePerPerson: 0,
        }}
        wageShareCount={0}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not reset values while closed', () => {
    const { rerender } = render(
      <RecordWageDialogComponent
        open={false}
        pending={false}
        initialWages={{
          totalIncome: 15000,
          subsidyAmount: 0,
          wagePerPerson: 0,
        }}
        wageShareCount={1}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    rerender(
      <RecordWageDialogComponent
        open
        pending={false}
        initialWages={{
          totalIncome: 15000,
          subsidyAmount: 0,
          wagePerPerson: 0,
        }}
        wageShareCount={1}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('金团工资')).toHaveValue('1');
  });
});
