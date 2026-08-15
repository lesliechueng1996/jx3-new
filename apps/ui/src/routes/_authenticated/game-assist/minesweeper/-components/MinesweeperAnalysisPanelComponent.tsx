import { CopyIcon, FlagIcon, MousePointerClickIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type MinesweeperAnalysisView = {
  explodeText: string;
  flagText: string;
  explodeKeys: string[];
  flagKeys: string[];
  stuck: boolean;
};

type MinesweeperAnalysisPanelComponentProps = {
  analysis: MinesweeperAnalysisView | null;
  onCopy: (text: string) => void;
  onApplyExplode: () => void;
  onApplyFlag: () => void;
};

const MinesweeperAnalysisPanelComponent = ({
  analysis,
  onCopy,
  onApplyExplode,
  onApplyFlag,
}: MinesweeperAnalysisPanelComponentProps) => {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        对照游戏同步棋盘后，点击「分析」查看下一步。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {analysis.stuck ? (
        <Alert>
          <AlertTitle>暂时没有确定的下一步</AlertTitle>
          <AlertDescription>
            当前数字和旗标还推不出必然操作。请再核对格子，或在游戏里猜一格后再同步回来分析。
          </AlertDescription>
        </Alert>
      ) : null}

      <AnalysisResultCard
        title="建议开格"
        description="这些格子可以安全点开"
        text={analysis.explodeText}
        applyLabel="一键点开"
        applyIcon={MousePointerClickIcon}
        onApply={onApplyExplode}
        onCopy={onCopy}
      />
      <AnalysisResultCard
        title="建议插旗"
        description="这些格子一定是雷，需要插旗"
        text={analysis.flagText}
        applyLabel="一键插旗"
        applyIcon={FlagIcon}
        onApply={onApplyFlag}
        onCopy={onCopy}
      />
    </div>
  );
};

type AnalysisResultCardProps = {
  title: string;
  description: string;
  text: string;
  applyLabel: string;
  applyIcon: typeof FlagIcon;
  onApply: () => void;
  onCopy: (text: string) => void;
};

const AnalysisResultCard = ({
  title,
  description,
  text,
  applyLabel,
  applyIcon: ApplyIcon,
  onApply,
  onCopy,
}: AnalysisResultCardProps) => {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" disabled={!text} onClick={onApply}>
              <ApplyIcon data-icon="inline-start" />
              {applyLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!text}
              onClick={() => onCopy(text)}
            >
              <CopyIcon data-icon="inline-start" />
              复制
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-sm break-all">{text || '没有建议'}</p>
      </CardContent>
    </Card>
  );
};

export default MinesweeperAnalysisPanelComponent;
