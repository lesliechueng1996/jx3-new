import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession, userSession } from '../../../../helpers/session';

const { getPinyinByText, searchIdioms, adminCreateIdiom } = vi.hoisted(() => ({
  getPinyinByText: vi.fn(),
  searchIdioms: vi.fn(),
  adminCreateIdiom: vi.fn(),
}));

vi.mock('uuid', () => {
  let count = 0;
  return {
    v4: () => `round-${++count}`,
  };
});

vi.mock('@/lib/api/admin/idiom-guess-api', () => ({
  getPinyinByText,
  searchIdioms,
}));

vi.mock('@/lib/api/admin/admin-idioms-api', () => ({
  adminCreateIdiom,
}));

describe('guess-idiom route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    getPinyinByText.mockReset();
    searchIdioms.mockReset();
    adminCreateIdiom.mockReset();
    getPinyinByText.mockResolvedValue({
      text: '一心一意',
      inDatabase: true,
      cells: [
        {
          position: 0,
          char: '一',
          pinyin: 'yi1',
          initial: '',
          final: 'i',
          tone: 1,
        },
        {
          position: 1,
          char: '心',
          pinyin: 'xin1',
          initial: 'x',
          final: 'in',
          tone: 1,
        },
        {
          position: 2,
          char: '一',
          pinyin: 'yi1',
          initial: '',
          final: 'i',
          tone: 1,
        },
        {
          position: 3,
          char: '意',
          pinyin: 'yi4',
          initial: '',
          final: 'i',
          tone: 4,
        },
      ],
    });
    searchIdioms.mockResolvedValue({
      items: [
        {
          id: '1',
          text: '一心一意',
          pinyin: 'yi1 xin1 yi1 yi4',
          meaning: null,
        },
      ],
      total: 1,
      analysis: {
        isUnique: true,
        byPosition: [],
        suggestedProbes: [],
      },
    });
  });

  it('rejects non-four-han input and submits a guess', async () => {
    const user = userEvent.setup();
    await renderApp('/game-assist/guess-idiom');
    expect(
      await screen.findByPlaceholderText('输入 4 个汉字'),
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), 'abc');
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ description: '请输入 4 个汉字' }),
    );

    await user.clear(screen.getByPlaceholderText('输入 4 个汉字'));
    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '一心一意');
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    await waitFor(() => {
      expect(getPinyinByText).toHaveBeenCalledWith('一心一意');
      expect(screen.getByText('词库')).toBeInTheDocument();
    });
  });

  it('searches, resets, and quick-adds as admin', async () => {
    const user = userEvent.setup();
    adminCreateIdiom.mockResolvedValue({ id: 'n' });
    await renderApp('/game-assist/guess-idiom');
    await screen.findByPlaceholderText('输入 4 个汉字');

    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '一心一意');
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    await screen.findByText('词库');

    await user.click(screen.getByRole('button', { name: '检索成语' }));
    await waitFor(() => {
      expect(searchIdioms).toHaveBeenCalled();
      expect(screen.getByText('唯一匹配')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: '将 一心一意 填入输入框' }),
    );
    expect(screen.getByPlaceholderText('输入 4 个汉字')).toHaveValue(
      '一心一意',
    );

    await user.click(screen.getByRole('button', { name: '添加成语到词库' }));
    await user.type(screen.getByLabelText('成语'), '真心实意');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateIdiom).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByText(/还没有录入猜测/)).toBeInTheDocument();
  });

  it('hides quick-add for non-admins and reports resolve errors', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    getPinyinByText.mockRejectedValue(new Error('解析失败了'));

    await renderApp('/game-assist/guess-idiom');
    await screen.findByPlaceholderText('输入 4 个汉字');
    expect(
      screen.queryByRole('button', { name: '添加成语到词库' }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '一心一意');
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '解析失败了' }),
      );
    });
  });

  it('blocks a second round, reports search errors, and removes a round', async () => {
    const user = userEvent.setup();
    searchIdioms.mockRejectedValue(new Error('搜索挂了'));
    adminCreateIdiom.mockRejectedValue(new Error('加不进去'));

    await renderApp('/game-assist/guess-idiom');
    await screen.findByPlaceholderText('输入 4 个汉字');

    await user.type(screen.getByPlaceholderText('输入 4 个汉字'), '一心一意');
    await user.click(screen.getByRole('button', { name: '提交猜测' }));
    await screen.findByText('词库');
    await user.click(screen.getByRole('button', { name: '心' }));
    await user.click(
      screen.getAllByRole('button', { name: '切换音节关联线' })[0],
    );

    await user.click(screen.getByRole('button', { name: '检索成语' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '搜索挂了' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '添加成语到词库' }));
    await user.type(screen.getByLabelText('成语'), '真心实意');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '加不进去' }),
      );
    });
    await user.click(screen.getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '删除本轮' }));
    expect(screen.getByText(/还没有录入猜测/)).toBeInTheDocument();
  });
});
