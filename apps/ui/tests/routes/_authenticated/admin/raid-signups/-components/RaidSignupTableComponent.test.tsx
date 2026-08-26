import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminRaidSignupListItem } from '@/lib/api/admin/admin-raid-signups-api';
import { RaidSignupTableComponent } from '@/routes/_authenticated/admin/raid-signups/-components/RaidSignupTableComponent';

const signup: AdminRaidSignupListItem = {
  id: '1',
  raidRunId: 'run-1',
  raidRunName: '周六团',
  startTime: '2026-08-22 21:00',
  dungeonName: '25人英雄河阳之战',
  role: 'dps',
  status: 'confirmed',
  isReserved: false,
  isLeader: true,
  isDarkRun: false,
  isFormationCore: true,
  characterName: '少侠甲',
  serverName: '梦江南',
  kungfuName: '紫霞功',
  createdAt: '2026-08-22 21:00',
};

describe('RaidSignupTableComponent', () => {
  it('shows an empty state', () => {
    render(<RaidSignupTableComponent items={[]} onView={vi.fn()} />);
    expect(screen.getByText('暂无报名数据')).toBeInTheDocument();
    expect(screen.queryByText('小队位置')).not.toBeInTheDocument();
  });

  it('views a member from the name or action button', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();

    render(
      <RaidSignupTableComponent
        items={[
          signup,
          {
            ...signup,
            id: '2',
            characterName: '少侠乙',
            raidRunName: null,
            startTime: null,
            dungeonName: null,
            serverName: null,
            kungfuName: null,
            role: 'pending',
            status: 'pending',
            isLeader: false,
            isFormationCore: false,
          },
        ]}
        onView={onView}
      />,
    );

    expect(screen.getByText('25人英雄河阳之战')).toBeInTheDocument();
    expect(screen.getByText('2026-08-22 21:00')).toBeInTheDocument();
    expect(screen.getByText('输出')).toBeInTheDocument();
    expect(screen.getByText('已确认')).toBeInTheDocument();
    expect(screen.getByText('团长')).toBeInTheDocument();
    expect(screen.getByText('阵眼')).toBeInTheDocument();
    expect(screen.getByText('待定')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '少侠甲' }));
    expect(onView).toHaveBeenCalledWith(signup);
    await user.click(screen.getAllByRole('button', { name: '查看开团' })[1]);
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', raidRunId: 'run-1' }),
    );
  });

  it('shows a loading overlay', () => {
    render(<RaidSignupTableComponent items={[]} isLoading onView={vi.fn()} />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
