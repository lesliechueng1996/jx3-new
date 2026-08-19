import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserFormComponent } from '@/routes/_authenticated/admin/users/-components/UserFormComponent';

const createValues = {
  name: '',
  email: '',
  password: '',
  role: 'user' as const,
};

describe('UserFormComponent', () => {
  it('does not submit invalid create values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <UserFormComponent
          formId="create-form"
          initialValues={createValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="create-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入用户名')).toBeInTheDocument();
  });

  it('submits create values and can change role', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <UserFormComponent
          formId="create-form"
          initialValues={createValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="create-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('用户名'), 'Alice');
    await user.type(screen.getByLabelText('邮箱'), 'alice@example.com');
    await user.type(screen.getByLabelText('密码'), 'password1');
    await user.click(screen.getByRole('button', { name: '管理员' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password1',
      role: 'admin',
    });
  });

  it('omits blank email and password in edit mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <UserFormComponent
          formId="edit-form"
          initialValues={{
            name: 'Alice',
            email: '',
            password: '',
            role: 'user',
          }}
          emailOptional
          passwordOptional
          roleDisabled
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="edit-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('用户名')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: undefined,
      password: undefined,
      role: 'user',
    });
  });

  it('shows an invalid email error in edit mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <UserFormComponent
          formId="edit-form"
          initialValues={{
            name: 'Alice',
            email: '',
            password: '',
            role: 'user',
          }}
          emailOptional
          passwordOptional
          onSubmit={onSubmit}
        />
        <button type="submit" form="edit-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('邮箱'), 'not-an-email');
    await user.type(screen.getByLabelText('密码'), 'short');
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    expect(screen.getByText('密码至少 8 位')).toBeInTheDocument();
  });

  it('ignores an empty role toggle change', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <UserFormComponent
          formId="create-form"
          initialValues={{
            name: 'Alice',
            email: 'alice@example.com',
            password: 'password1',
            role: 'user',
          }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="create-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '用户' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user' }),
    );
  });
});
