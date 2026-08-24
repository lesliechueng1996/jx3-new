import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrickGoldInputComponent } from '@/routes/_authenticated/raid-run/-components/BrickGoldInputComponent';

describe('BrickGoldInputComponent', () => {
  it('emits brick and gold changes and ignores invalid text', () => {
    const onChange = vi.fn();
    render(
      <BrickGoldInputComponent
        id="wage"
        label="金团工资"
        brick=""
        gold=""
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('金团工资'), {
      target: { value: '1' },
    });
    expect(onChange).toHaveBeenCalledWith('1', '');

    fireEvent.change(screen.getByLabelText('金团工资'), {
      target: { value: 'x' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.change(document.getElementById('wage-gold') as HTMLElement, {
      target: { value: '5000' },
    });
    expect(onChange).toHaveBeenCalledWith('', '5000');

    fireEvent.change(document.getElementById('wage-gold') as HTMLElement, {
      target: { value: '1.5' },
    });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('marks the fields invalid and disabled', () => {
    render(
      <BrickGoldInputComponent
        id="wage"
        label="个人工资"
        brick="1"
        gold="0"
        invalid
        disabled
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('个人工资')).toBeDisabled();
    expect(screen.getByLabelText('个人工资')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(document.getElementById('wage-gold')).toBeDisabled();
    expect(document.getElementById('wage-gold')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
