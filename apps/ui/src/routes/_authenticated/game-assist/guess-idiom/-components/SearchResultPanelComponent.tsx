import { Badge } from '#/components/ui/badge';
import type { IdiomGuessResult } from '../-lib/idiom-guess-schema';

type SearchResultPanelComponentProps = {
  result: IdiomGuessResult | null;
  searching: boolean;
};

const POSITION_LABELS = ['第 1 字', '第 2 字', '第 3 字', '第 4 字'];

const SearchResultPanelComponent = ({
  result,
  searching,
}: SearchResultPanelComponentProps) => {
  if (searching) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        正在检索成语…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        完成标注后点击「检索成语」，结果会显示在这里。
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">检索结果</h2>
        <Badge variant="secondary">共 {result.total} 个候选</Badge>
        {result.analysis.isUnique ? (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
            唯一匹配
          </Badge>
        ) : null}
      </div>

      {result.analysis.message ? (
        <p className="text-sm text-muted-foreground">
          {result.analysis.message}
        </p>
      ) : null}

      {result.items.length > 0 ? (
        <ul className="space-y-2">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="font-medium">{item.text}</div>
              <div className="text-muted-foreground">{item.pinyin}</div>
            </li>
          ))}
        </ul>
      ) : null}

      {result.total > 1 ? (
        <details className="rounded-md border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">
            查看位置分析
          </summary>
          <div className="mt-3 space-y-2">
            {result.analysis.byPosition.map((item) => (
              <div
                key={item.position}
                className="rounded-md bg-muted/50 p-3 text-sm"
              >
                <div className="font-medium">
                  {POSITION_LABELS[item.position] ??
                    `第 ${item.position + 1} 字`}
                </div>
                <div className="mt-1 text-muted-foreground">
                  字：{item.charOptions.join('、') || '—'}
                </div>
                <div className="text-muted-foreground">
                  声母：{item.initialOptions.join('、') || '—'}
                </div>
                <div className="text-muted-foreground">
                  韵母：{item.finalOptions.join('、') || '—'}
                </div>
                <div className="text-muted-foreground">
                  声调：{item.toneOptions.join('、') || '—'}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {result.analysis.suggestedProbes.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">建议试探词</h3>
          <ul className="space-y-2">
            {result.analysis.suggestedProbes.map((probe) => (
              <li
                key={probe.text}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <div className="font-medium">{probe.text}</div>
                <div className="text-muted-foreground">{probe.reason}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default SearchResultPanelComponent;
