import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import SearchResultPanelComponent from '@/routes/_authenticated/game-assist/guess-idiom/-components/SearchResultPanelComponent';
import type { IdiomGuessResult } from '@/routes/_authenticated/game-assist/guess-idiom/-lib/idiom-guess-schema';

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
  it('shows searching and empty states', () => {
    const { rerender } = render(
      <SearchResultPanelComponent result={null} searching />,
    );
    expect(screen.getByText('正在检索成语…')).toBeInTheDocument();

    rerender(<SearchResultPanelComponent result={null} searching={false} />);
    expect(screen.getByText(/完成标注后点击/)).toBeInTheDocument();
  });

  it('renders matches, position analysis, and probes', async () => {
    const user = userEvent.setup();
    render(<SearchResultPanelComponent result={result} searching={false} />);

    expect(screen.getByText('共 2 个候选')).toBeInTheDocument();
    expect(screen.getByText('一心一意')).toBeInTheDocument();
    expect(screen.getByText('还有多个候选')).toBeInTheDocument();
    expect(screen.getByText('真心实意')).toBeInTheDocument();

    await user.click(screen.getByText('查看位置分析'));
    expect(screen.getByText('第 1 字')).toBeInTheDocument();
    expect(screen.getByText('第 10 字')).toBeInTheDocument();
  });

  it('marks a unique match', () => {
    render(
      <SearchResultPanelComponent
        searching={false}
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
