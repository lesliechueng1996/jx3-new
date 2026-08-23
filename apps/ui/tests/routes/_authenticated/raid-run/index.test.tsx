import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import { createRaidRun } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { renderApp } from '../../../helpers/render';
import { userSession } from '../../../helpers/session';

const { listAllKungfus, listAllGameServers, searchGameDungeons } = vi.hoisted(
  () => ({
    listAllKungfus: vi.fn(),
    listAllGameServers: vi.fn(),
    searchGameDungeons: vi.fn(),
  }),
);

vi.mock('@/lib/api/kungfus-api', () => ({
  kungfusAllQueryKey: ['kungfus-all'],
  listAllKungfus,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

describe('raid-run route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    searchGameDungeons.mockReset();
    listAllKungfus.mockResolvedValue([]);
    listAllGameServers.mockResolvedValue([]);
    searchGameDungeons.mockResolvedValue([]);
    useRaidRun.setState({
      raidRun: createRaidRun(),
      selectedSlot: null,
    });
  });

  it('shows the raid info and team layout, then the member panel after a click', async () => {
    const user = userEvent.setup();
    await renderApp('/raid-run');

    expect(
      await screen.findByRole('heading', { name: '开团' }),
    ).toBeInTheDocument();
    expect(screen.getByText('开团信息')).toBeInTheDocument();
    expect(screen.getByText('团队布局')).toBeInTheDocument();
    expect(screen.queryByText('团员属性')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '第1队第1位' }));
    expect(await screen.findByText('团员属性')).toBeInTheDocument();
    expect(screen.getByText('第1队第1位')).toBeInTheDocument();
  });
});
