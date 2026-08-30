import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../helpers/render';

const { listRaidRunCalendar } = vi.hoisted(() => ({
  listRaidRunCalendar: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunCalendarQueryKey: (from: string, to: string) =>
    ['raid-run-calendar', from, to] as const,
  listRaidRunCalendar,
}));

describe('UpcomingRaidsComponent', () => {
  beforeEach(() => {
    listRaidRunCalendar.mockReset();
    listRaidRunCalendar.mockResolvedValue({ items: [] });
  });

  it('shows a loading state while upcoming raids are fetched', async () => {
    listRaidRunCalendar.mockImplementation(() => new Promise(() => {}));

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('即将开团')).toBeInTheDocument();
    expect(screen.getByLabelText('加载即将开团')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is upcoming', async () => {
    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('暂无即将开始的团')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去开团' })).toHaveAttribute(
      'href',
      '/raid-run',
    );
  });

  it('lists upcoming raids and links to their pages', async () => {
    listRaidRunCalendar.mockResolvedValue({
      items: [
        {
          id: 'run-1',
          name: '周六团',
          status: 'recruiting',
          gatherTime: '2026-09-05T12:00:00.000Z',
          startTime: '2026-09-05T13:00:00.000Z',
          endTime: '2026-09-05T16:00:00.000Z',
          dungeonName: '25人英雄河阳之战',
        },
        {
          id: 'run-2',
          name: '补刀团',
          status: 'ongoing',
          gatherTime: null,
          startTime: '2026-09-06T13:00:00.000Z',
          endTime: null,
          dungeonName: null,
        },
      ],
    });

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('周六团')).toBeInTheDocument();
    expect(
      screen.getByText('25人英雄河阳之战 · 9月5日 20:00'),
    ).toBeInTheDocument();
    expect(screen.getByText('招募中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /周六团/ })).toHaveAttribute(
      'href',
      '/raid-run/run-1',
    );

    expect(screen.getByText('补刀团')).toBeInTheDocument();
    expect(screen.getByText('9月6日 21:00')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /补刀团/ })).toHaveAttribute(
      'href',
      '/raid-run/run-2',
    );
  });

  it('shows an error when the upcoming query fails', async () => {
    listRaidRunCalendar.mockRejectedValue(new Error('boom'));

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(
      await screen.findByText('加载即将开团失败，请稍后重试。'),
    ).toBeInTheDocument();
  });
});
