import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  type AdminIdiomCreateFormValues,
  adminCreateIdiom,
} from '@/lib/api/admin/admin-idioms-api';
import { getPinyinByText, searchIdioms } from '@/lib/api/admin/idiom-guess-api';
import { handleApiError, MAX_ROUNDS } from '@/lib/api-client';
import GuessInputBarComponent from './-components/GuessInputBarComponent';
import GuessRoundListComponent from './-components/GuessRoundListComponent';
import IdiomQuickAddDialogComponent from './-components/IdiomQuickAddDialogComponent';
import SearchResultPanelComponent from './-components/SearchResultPanelComponent';
import {
  DEFAULT_CELL_COLOR,
  type GuessRoundState,
  type IdiomGuessResult,
} from './-lib/idiom-guess-schema';

export const Route = createFileRoute(
  '/_authenticated/game-assist/guess-idiom/',
)({
  component: GuessIdiomComponent,
});

export const FOUR_HAN_REGEX = /^\p{Script=Han}{4}$/u;

// const createRoundId = (): string => crypto.randomUUID();
const createRoundId = (): string => uuidv4();

function GuessIdiomComponent() {
  const [rounds, setRounds] = useState<GuessRoundState[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchResult, setSearchResult] = useState<IdiomGuessResult | null>(
    null,
  );
  const { isAdmin } = Route.useRouteContext();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: (text: string) => getPinyinByText(text),
    onSuccess: (response) => {
      setRounds((current) => [
        ...current,
        {
          id: createRoundId(),
          text: response.text,
          inDatabase: response.inDatabase,
          cells: response.cells.map((cell) => ({
            position: cell.position,
            char: cell.char,
            pinyin: cell.pinyin,
            initial: cell.initial,
            final: cell.final,
            tone: cell.tone,
            charColor: DEFAULT_CELL_COLOR,
            initialColor: DEFAULT_CELL_COLOR,
            finalColor: DEFAULT_CELL_COLOR,
            toneColor: DEFAULT_CELL_COLOR,
            syllableLink: DEFAULT_CELL_COLOR,
          })),
        },
      ]);
      setInputText('');
      setSearchResult(null);
    },
    onError: (error) => {
      handleApiError(error, '解析失败');
    },
  });

  const handleSubmitGuess = () => {
    const text = inputText.trim();
    if (!FOUR_HAN_REGEX.test(text)) {
      toast.add({
        type: 'error',
        description: '请输入 4 个汉字',
      });
      return;
    }
    if (rounds.length >= MAX_ROUNDS) {
      toast.add({
        type: 'error',
        description: '最多录入 15 轮猜测',
      });
      return;
    }
    resolveMutation.mutate(text);
  };

  const searchMutation = useMutation({
    mutationFn: () =>
      searchIdioms({
        rounds,
        limit: MAX_ROUNDS,
      }),
    onSuccess: (response) => {
      setSearchResult(response);
    },
    onError: (error) => {
      handleApiError(error, '搜索成语失败');
    },
  });

  const handleReset = () => {
    setInputText('');
    setRounds([]);
    setSearchResult(null);
  };

  const createIdiomMutation = useMutation({
    mutationFn: (values: AdminIdiomCreateFormValues) =>
      adminCreateIdiom(values),
    onSuccess: () => {
      toast.add({
        type: 'success',
        description: '成语已添加到词库',
      });
      setQuickAddOpen(false);
    },
    onError: (error) => {
      handleApiError(error, '添加成语失败');
    },
  });

  return (
    <section className="space-y-6">
      <SearchResultPanelComponent
        result={searchResult}
        searching={searchMutation.isPending}
        onSelectIdiom={setInputText}
      />

      <GuessRoundListComponent
        rounds={rounds}
        onChangeRound={(id, round) =>
          setRounds((current) =>
            current.map((item) => (item.id === id ? round : item)),
          )
        }
        onRemoveRound={(id) => {
          setRounds((current) => current.filter((item) => item.id !== id));
          setSearchResult(null);
        }}
      />

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <GuessInputBarComponent
          value={inputText}
          disabled={resolveMutation.isPending}
          maxRoundsReached={rounds.length >= MAX_ROUNDS}
          pending={resolveMutation.isPending}
          onChange={setInputText}
          onSubmit={handleSubmitGuess}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={rounds.length === 0 || searchMutation.isPending}
            onClick={() => searchMutation.mutate()}
          >
            {searchMutation.isPending ? '检索中…' : '检索成语'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            重置
          </Button>
          {isAdmin ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQuickAddOpen(true)}
            >
              添加成语到词库
            </Button>
          ) : null}
        </div>

        <IdiomQuickAddDialogComponent
          open={quickAddOpen}
          pending={createIdiomMutation.isPending}
          onOpenChange={setQuickAddOpen}
          onSubmit={(values) => createIdiomMutation.mutate(values)}
        />
      </div>
    </section>
  );
}
