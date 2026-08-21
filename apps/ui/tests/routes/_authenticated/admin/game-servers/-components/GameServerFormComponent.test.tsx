import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameServerFormComponent } from '@/routes/_authenticated/admin/game-servers/-components/GameServerFormComponent';

const emptyValues = {
  serverId: '',
  zone: '',
  name: '',
  aliasText: '',
};

describe('GameServerFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameServerFormComponent
          formId="game-server-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-server-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入服务器 ID')).toBeInTheDocument();
    expect(screen.getByText('请输入大区')).toBeInTheDocument();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
  });

  it('submits values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameServerFormComponent
          formId="game-server-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-server-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('服务器 ID'), 'mengjiangnan');
    await user.type(screen.getByLabelText('大区'), '电信一区');
    await user.type(screen.getByLabelText('名称'), '梦江南');
    await user.type(screen.getByLabelText('别名'), '梦岛');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
      aliasText: '梦岛',
    });
  });

  it('shows length errors and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameServerFormComponent
          formId="game-server-form"
          initialValues={{
            serverId: 'x'.repeat(65),
            zone: 'x'.repeat(65),
            name: 'x'.repeat(65),
            aliasText: 'x'.repeat(201),
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-server-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('服务器 ID')).toBeDisabled();
    expect(screen.getByLabelText('大区')).toBeDisabled();
    expect(screen.getByLabelText('名称')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('服务器 ID 最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('大区最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('名称最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('别名最多 200 个字符')).toBeInTheDocument();
  });
});
