import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SchoolFormComponent } from '@/routes/_authenticated/admin/schools/-components/SchoolFormComponent';

const emptyValues = {
  name: '',
  type: 'school' as const,
  icon: '',
  aliasText: '',
};

describe('SchoolFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <SchoolFormComponent
          formId="school-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="school-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
  });

  it('submits values and can change type', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <SchoolFormComponent
          formId="school-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="school-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '纯阳');
    await user.type(screen.getByLabelText('图标'), '/icon.png');
    await user.type(screen.getByLabelText('别名'), '纯阳宫');
    await user.click(screen.getByRole('button', { name: '流派' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '纯阳',
      type: 'genre',
      icon: '/icon.png',
      aliasText: '纯阳宫',
    });
  });

  it('ignores an empty type toggle change', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <SchoolFormComponent
          formId="school-form"
          initialValues={{
            name: '纯阳',
            type: 'school',
            icon: '',
            aliasText: '',
          }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="school-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '门派' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'school' }),
    );
  });

  it('shows an icon length error and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <SchoolFormComponent
          formId="school-form"
          initialValues={{
            name: '纯阳',
            type: 'school',
            icon: 'x'.repeat(513),
            aliasText: 'x'.repeat(201),
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="school-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('名称')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('图标地址最多 512 个字符')).toBeInTheDocument();
    expect(screen.getByText('别名最多 200 个字符')).toBeInTheDocument();
  });
});
