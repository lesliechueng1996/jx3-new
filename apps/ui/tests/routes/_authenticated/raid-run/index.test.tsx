import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import {
  createRaidRun,
  setRaidRunName,
  setRaidRunReservedTank,
  setRaidRunStatus,
  setRaidSignupDarkRunExclusive,
  setRaidSignupFormationCoreExclusive,
  setRaidSignupLeaderExclusive,
  updateRaidSignupAt,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { setRaidSignupCharacterName } from '@/routes/_authenticated/raid-run/-lib/raid-signup';
import { renderApp } from '../../../helpers/render';
import { userSession } from '../../../helpers/session';

const {
  listAllKungfus,
  listAllGameServers,
  searchGameDungeons,
  createRaidRunApi,
  getRaidRun,
  saveRaidRun,
  updateRaidRunStatus,
} = vi.hoisted(() => ({
  listAllKungfus: vi.fn(),
  listAllGameServers: vi.fn(),
  searchGameDungeons: vi.fn(),
  createRaidRunApi: vi.fn(),
  getRaidRun: vi.fn(),
  saveRaidRun: vi.fn(),
  updateRaidRunStatus: vi.fn(),
}));

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

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunDetailQueryKey: (id: string) => ['raid-run', id],
  createRaidRun: createRaidRunApi,
  getRaidRun,
  saveRaidRun,
  updateRaidRunStatus,
  updateRaidRunGameRaidId: vi.fn(),
  updateRaidRunWages: vi.fn(),
}));

vi.mock('@/lib/api/raid-loots-api', () => ({
  raidRunLootsQueryKey: (id: string) => ['raid-run-loots', id],
  listRaidRunLoots: vi.fn().mockResolvedValue([]),
  createRaidRunLoot: vi.fn(),
  updateRaidRunLoot: vi.fn(),
  deleteRaidRunLoot: vi.fn(),
}));

vi.mock('@/lib/api/game-items-api', () => ({
  gameItemsSearchQueryKey: (name: string) => ['game-items-search', name],
  searchGameItems: vi.fn().mockResolvedValue([]),
  createGameItemQuick: vi.fn(),
}));

const dungeon = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '25人英雄',
  playerLimit: 25,
  bossCount: 6,
  difficulty: 'heroic' as const,
};

const gatherTime = new Date('2026-08-22T12:00:00.000Z');
const startTime = new Date('2026-08-22T13:00:00.000Z');
const endTime = new Date('2026-08-22T16:00:00.000Z');

const validRun = () => {
  let run = createRaidRun({
    name: '周六团',
    dungeon,
    gatherTime,
    startTime,
    endTime,
  });
  run = setRaidRunReservedTank(run, 1);
  run = updateRaidSignupAt(run, 1, 1, (signup) =>
    setRaidSignupCharacterName(signup, '团长'),
  );
  run = setRaidSignupLeaderExclusive(run, 1, 1, true);
  run = setRaidSignupDarkRunExclusive(run, 1, 1, true);
  run = setRaidSignupFormationCoreExclusive(run, 1, 1, true);
  return run;
};

const detailFromRun = (
  run: ReturnType<typeof validRun>,
  status = run.status,
) => ({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: run.name ?? '周六团',
  description: run.description ?? null,
  status,
  dungeonId: dungeon.id,
  dungeon,
  gatherTime: gatherTime.toISOString(),
  startTime: startTime.toISOString(),
  endTime: endTime.toISOString(),
  reservedTank: run.reservedTank,
  reservedHealer: run.reservedHealer,
  reservedDps: run.reservedDps,
  reservedBoss: run.reservedBoss,
  remark: run.remark ?? null,
  gameRaidId: null,
  totalIncome: 0,
  subsidyAmount: 0,
  wagePerPerson: 0,
  signups: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      groupNumber: 1,
      positionNumber: 1,
      role: 'tank' as const,
      isLeader: true,
      isDarkRun: true,
      isFormationCore: true,
      serverId: null,
      characterName: '团长',
      schoolId: null,
      kungfuId: null,
      remark: null,
    },
  ],
});

describe('raid-run route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    listAllKungfus.mockReset();
    listAllGameServers.mockReset();
    searchGameDungeons.mockReset();
    createRaidRunApi.mockReset();
    getRaidRun.mockReset();
    saveRaidRun.mockReset();
    updateRaidRunStatus.mockReset();
    vi.mocked(toast.add).mockClear();
    listAllKungfus.mockResolvedValue([]);
    listAllGameServers.mockResolvedValue([]);
    searchGameDungeons.mockResolvedValue([]);
    useRaidRun.getState().resetRaidRun();
  });

  it('shows the raid info and team layout, then the member panel after a click', async () => {
    const user = userEvent.setup();
    await renderApp('/raid-run');

    expect(await screen.findByText('开团信息')).toBeInTheDocument();
    expect(document.title).toBe('开团 · 四堆专用');
    expect(screen.getByText('团队布局')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂存' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '发布开团' }),
    ).toBeInTheDocument();
    expect(screen.getByText('待开始')).toBeInTheDocument();
    expect(screen.queryByText('团员属性')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '第1队第1位' }));
    expect(await screen.findByText('团员属性')).toBeInTheDocument();
    expect(screen.getByText('第1队第1位')).toBeInTheDocument();
  });

  it('blocks stash when the roster is incomplete', async () => {
    const user = userEvent.setup();
    await renderApp('/raid-run');

    await user.click(screen.getByRole('button', { name: '暂存' }));

    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '团队名称不能为空,且不能超过64个字符',
    });
    expect(createRaidRunApi).not.toHaveBeenCalled();
  });

  it('stashes a new raid run and navigates to the detail route', async () => {
    const user = userEvent.setup();
    const run = validRun();
    const detail = detailFromRun(run);
    createRaidRunApi.mockResolvedValue(detail);

    const { router } = await renderApp('/raid-run');
    useRaidRun.getState().updateRaidRun(() => run);

    await user.click(screen.getByRole('button', { name: '暂存' }));

    await waitFor(() => {
      expect(createRaidRunApi).toHaveBeenCalled();
    });
    expect(saveRaidRun).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '已暂存',
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      );
    });
  });

  it('publishes a new raid run then navigates', async () => {
    const user = userEvent.setup();
    const run = validRun();
    createRaidRunApi.mockResolvedValue(detailFromRun(run));
    updateRaidRunStatus.mockResolvedValue({ status: 'recruiting' });

    const { router } = await renderApp('/raid-run');
    useRaidRun.getState().updateRaidRun(() => run);

    await user.click(screen.getByRole('button', { name: '发布开团' }));

    await waitFor(() => {
      expect(updateRaidRunStatus).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'recruiting',
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      );
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '已发布开团',
    });
  });

  it('saves an existing raid run with put', async () => {
    const user = userEvent.setup();
    const run = validRun();
    const detail = detailFromRun(run, 'recruiting');
    getRaidRun.mockResolvedValue(detail);
    saveRaidRun.mockResolvedValue(detail);

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(
      await screen.findByRole('button', { name: '保存' }),
    ).toBeInTheDocument();
    expect(screen.getByText('招募中')).toBeInTheDocument();

    useRaidRun
      .getState()
      .updateRaidRun((current) => setRaidRunName(current, '周日团'));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(saveRaidRun).toHaveBeenCalled();
    });
    expect(createRaidRunApi).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '已保存',
    });
  });

  it('starts a recruiting raid when there are no unsaved changes', async () => {
    const user = userEvent.setup();
    const run = setRaidRunStatus(validRun(), 'recruiting');
    getRaidRun.mockResolvedValue(detailFromRun(run, 'recruiting'));
    updateRaidRunStatus.mockResolvedValue({ status: 'ongoing' });

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    const start = await screen.findByRole('button', { name: '开始团本' });
    expect(start).toBeEnabled();
    await user.click(start);

    await waitFor(() => {
      expect(updateRaidRunStatus).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'ongoing',
      );
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '团本已开始',
    });
  });

  it('completes an ongoing raid', async () => {
    const user = userEvent.setup();
    const run = setRaidRunStatus(validRun(), 'ongoing');
    getRaidRun.mockResolvedValue(detailFromRun(run, 'ongoing'));
    updateRaidRunStatus.mockResolvedValue({ status: 'completed' });

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    await user.click(await screen.findByRole('button', { name: '完成团本' }));

    await waitFor(() => {
      expect(updateRaidRunStatus).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'completed',
      );
    });
  });

  it('shows a load error on the detail route', async () => {
    getRaidRun.mockRejectedValue(new Error('开团记录不存在'));

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(await screen.findByText('开团记录不存在')).toBeInTheDocument();
  });

  it('toasts API errors from stash', async () => {
    const user = userEvent.setup();
    createRaidRunApi.mockRejectedValue(new Error('暂存失败'));

    await renderApp('/raid-run');
    useRaidRun.getState().updateRaidRun(() => validRun());
    await user.click(screen.getByRole('button', { name: '暂存' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '暂存失败',
      });
    });
  });

  it('shows loading then the editor on the detail route', async () => {
    let resolveDetail:
      | ((value: ReturnType<typeof detailFromRun>) => void)
      | undefined;
    getRaidRun.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    );

    const rendered = await renderApp(
      '/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(await screen.findByText('加载中…')).toBeInTheDocument();
    resolveDetail?.(detailFromRun(validRun(), 'pending'));
    expect(await screen.findByText('开团信息')).toBeInTheDocument();
    expect(rendered).toBeTruthy();
  });

  it('shows a fallback load error when the rejection is not an Error', async () => {
    getRaidRun.mockRejectedValue('boom');

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    expect(await screen.findByText('获取开团失败')).toBeInTheDocument();
  });

  it('disables start when the recruiting roster is dirty', async () => {
    const run = setRaidRunStatus(validRun(), 'recruiting');
    getRaidRun.mockResolvedValue(detailFromRun(run, 'recruiting'));

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await screen.findByRole('button', { name: '开始团本' });

    useRaidRun
      .getState()
      .updateRaidRun((current) => setRaidRunName(current, '改名'));

    expect(await screen.findByText('有未保存的修改')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始团本' })).toBeDisabled();
  });

  it('publishes an existing pending raid run', async () => {
    const user = userEvent.setup();
    const run = validRun();
    const detail = detailFromRun(run);
    getRaidRun.mockResolvedValue(detail);
    saveRaidRun.mockResolvedValue(detail);
    updateRaidRunStatus.mockResolvedValue({ status: 'recruiting' });

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await user.click(await screen.findByRole('button', { name: '发布开团' }));

    await waitFor(() => {
      expect(saveRaidRun).toHaveBeenCalled();
      expect(updateRaidRunStatus).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'recruiting',
      );
    });
  });

  it('toasts start and complete failures', async () => {
    const user = userEvent.setup();
    getRaidRun.mockResolvedValue(
      detailFromRun(setRaidRunStatus(validRun(), 'ongoing'), 'ongoing'),
    );
    updateRaidRunStatus.mockRejectedValue(new Error('完成失败'));

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await user.click(await screen.findByRole('button', { name: '完成团本' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '完成失败',
      });
    });
  });

  it('toasts start failures', async () => {
    const user = userEvent.setup();
    getRaidRun.mockResolvedValue(
      detailFromRun(setRaidRunStatus(validRun(), 'recruiting'), 'recruiting'),
    );
    updateRaidRunStatus.mockRejectedValue(new Error('开始失败'));

    await renderApp('/raid-run/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await user.click(await screen.findByRole('button', { name: '开始团本' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '开始失败',
      });
    });
  });

  it('toasts publish failures', async () => {
    const user = userEvent.setup();
    createRaidRunApi.mockRejectedValue(new Error('发布失败'));

    await renderApp('/raid-run');
    useRaidRun.getState().updateRaidRun(() => validRun());
    await user.click(screen.getByRole('button', { name: '发布开团' }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '发布失败',
      });
    });
  });
});
