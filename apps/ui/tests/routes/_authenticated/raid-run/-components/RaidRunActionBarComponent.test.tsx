import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RaidRunActionBarComponent from '@/routes/_authenticated/raid-run/-components/RaidRunActionBarComponent';

describe('RaidRunActionBarComponent', () => {
  it('shows stash and publish actions while pending', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onPublish = vi.fn();
    render(
      <RaidRunActionBarComponent
        status="pending"
        isDirty
        onSave={onSave}
        onPublish={onPublish}
        onStart={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('待开始')).toBeInTheDocument();
    expect(screen.getByText('有未保存的修改')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '暂存' }));
    await user.click(screen.getByRole('button', { name: '发布开团' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: '开始团本' }),
    ).not.toBeInTheDocument();
  });

  it('shows save and start while recruiting and disables start when dirty', () => {
    render(
      <RaidRunActionBarComponent
        status="recruiting"
        isDirty
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('招募中')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '开始团本' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: '发布开团' }),
    ).not.toBeInTheDocument();
  });

  it('starts an ongoing raid when the roster is saved', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <RaidRunActionBarComponent
        status="recruiting"
        isDirty={false}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={onStart}
        onComplete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '开始团本' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows complete while ongoing', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <RaidRunActionBarComponent
        status="ongoing"
        isDirty={false}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={vi.fn()}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByText('进行中')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '完成团本' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('hides the right action when completed', () => {
    render(
      <RaidRunActionBarComponent
        status="completed"
        isDirty={false}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '开始团本' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '完成团本' }),
    ).not.toBeInTheDocument();
  });

  it('hides the right action when cancelled', () => {
    render(
      <RaidRunActionBarComponent
        status="cancelled"
        isDirty={false}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText('已取消')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('disables left actions while pending a request', () => {
    render(
      <RaidRunActionBarComponent
        status="pending"
        isDirty={false}
        isPending
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onStart={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '暂存' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '发布开团' })).toBeDisabled();
    expect(screen.queryByText('有未保存的修改')).not.toBeInTheDocument();
  });
});
