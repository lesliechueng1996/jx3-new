import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { copyText } from '@/lib/copy-text';
import SearchResultPanelComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/SearchResultPanelComponent';
import type { IdiomGuessResult } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

vi.mock('@/lib/copy-text', () => ({
  copyText: vi.fn(),
}));

const result: IdiomGuessResult = {
  items: [
    { id: '1', text: '一心一意', pinyin: 'yi1 xin1 yi1 yi4', meaning: null },
    {
      id: '2',
      text: '三心二意',
      pinyin: 'san1 xin1 er4 yi4',
      meaning: '不专一',
    },
  ],
  total: 2,
  analysis: {
    isUnique: false,
    message: '还有多个候选',
    byPosition: [
      {
        position: 0,
        charOptions: ['一', '三'],
        initialOptions: [],
        finalOptions: ['i'],
        toneOptions: [1],
      },
      {
        position: 9,
        charOptions: [],
        initialOptions: ['x'],
        finalOptions: [],
        toneOptions: [],
      },
    ],
    suggestedProbes: [{ text: '真心实意', reason: '区分声母' }],
  },
};

describe('SearchResultPanelComponent', () => {
  beforeEach(() => {
    vi.mocked(copyText).mockReset();
    vi.mocked(toast.add).mockClear();
    vi.mocked(copyText).mockResolvedValue(true);
  });

  it('shows searching and empty states', () => {
    const onSelectIdiom = vi.fn();
    const { rerender } = render(
      <SearchResultPanelComponent
        result={null}
        searching
        onSelectIdiom={onSelectIdiom}
      />,
    );
    expect(screen.getByText('正在检索成语…')).toBeInTheDocument();

    rerender(
      <SearchResultPanelComponent
        result={null}
        searching={false}
        onSelectIdiom={onSelectIdiom}
      />,
    );
    expect(screen.getByText(/完成标注后点击/)).toBeInTheDocument();
  });

  it('renders matches, position analysis, and probes', async () => {
    const user = userEvent.setup();
    const onSelectIdiom = vi.fn();
    render(
      <SearchResultPanelComponent
        result={result}
        searching={false}
        onSelectIdiom={onSelectIdiom}
      />,
    );

    expect(screen.getByText('共 2 个候选')).toBeInTheDocument();
    expect(screen.getByText('一心一意')).toBeInTheDocument();
    expect(screen.getByText('还有多个候选')).toBeInTheDocument();
    expect(screen.getByText('真心实意')).toBeInTheDocument();
    expect(
      screen.getAllByText('点击即可复制并填入下方输入框').length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByText('查看位置分析'));
    expect(screen.getByText('第 1 字')).toBeInTheDocument();
    expect(screen.getByText('第 10 字')).toBeInTheDocument();
  });

  it('copies and fills the input when a candidate or probe is clicked', async () => {
    const user = userEvent.setup();
    const onSelectIdiom = vi.fn();
    render(
      <SearchResultPanelComponent
        result={result}
        searching={false}
        onSelectIdiom={onSelectIdiom}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: '复制 一心一意 并填入输入框' }),
    );
    expect(onSelectIdiom).toHaveBeenCalledWith('一心一意');
    expect(copyText).toHaveBeenCalledWith('一心一意');
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      description: '已复制到剪切板',
    });

    await user.click(
      screen.getByRole('button', { name: '复制试探词 真心实意 并填入输入框' }),
    );
    expect(onSelectIdiom).toHaveBeenCalledWith('真心实意');
    expect(copyText).toHaveBeenCalledWith('真心实意');
  });

  it('toasts an error when copying a candidate fails', async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValue(false);
    render(
      <SearchResultPanelComponent
        result={result}
        searching={false}
        onSelectIdiom={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: '复制 一心一意 并填入输入框' }),
    );
    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '复制失败，请手动复制',
    });
  });

  it('marks a unique match', () => {
    render(
      <SearchResultPanelComponent
        searching={false}
        onSelectIdiom={vi.fn()}
        result={{
          items: [],
          total: 1,
          analysis: {
            isUnique: true,
            message: '',
            byPosition: [],
            suggestedProbes: [],
          },
        }}
      />,
    );
    expect(screen.getByText('唯一匹配')).toBeInTheDocument();
  });
});
