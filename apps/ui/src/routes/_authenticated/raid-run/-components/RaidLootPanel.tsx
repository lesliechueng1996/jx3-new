import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  updateRaidRunGameRaidId,
  updateRaidRunWages,
} from '@/lib/api/raid-runs-api';
import { handleApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import { formatGold } from '../-lib/gold';
import {
  countRaidRunWageShareSignups,
  setRaidRunGameRaidId,
  setRaidRunWages,
} from '../-lib/raid-run';
import { RecordGameRaidIdDialogComponent } from './RecordGameRaidIdDialogComponent';
import { RecordWageDialogComponent } from './RecordWageDialogComponent';

type Props = {
  className?: string;
};

const RaidLootPanel = ({ className }: Props) => {
  const { raidRun, updateRaidRun } = useRaidRun();
  const [gameRaidIdOpen, setGameRaidIdOpen] = useState(false);
  const [wagesOpen, setWagesOpen] = useState(false);

  const gameRaidIdMutation = useMutation({
    mutationFn: (gameRaidId: string) =>
      updateRaidRunGameRaidId(raidRun.id, gameRaidId),
    onSuccess: (data) => {
      toast.add({
        type: 'success',
        title: '游戏副本ID已记录',
      });
      updateRaidRun((run) => setRaidRunGameRaidId(run, data.gameRaidId));
      setGameRaidIdOpen(false);
    },
    onError: (error) => handleApiError(error, '记录副本ID失败'),
  });

  const wagesMutation = useMutation({
    mutationFn: (wages: {
      totalIncome: number;
      subsidyAmount: number;
      wagePerPerson: number;
    }) => updateRaidRunWages(raidRun.id, wages),
    onSuccess: (data) => {
      toast.add({
        type: 'success',
        title: '工资已记录',
      });
      updateRaidRun((run) =>
        setRaidRunWages(run, {
          totalIncome: data.totalIncome,
          subsidyAmount: data.subsidyAmount,
          wagePerPerson: data.wagePerPerson,
        }),
      );
      setWagesOpen(false);
    },
    onError: (error) => handleApiError(error, '记录工资失败'),
  });

  const gameRaidIdLabel = raidRun.gameRaidId?.trim()
    ? raidRun.gameRaidId
    : '未记录';

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>掉落物品</CardTitle>
        <CardDescription>
          <span className="flex flex-col gap-1">
            <span>游戏副本ID：{gameRaidIdLabel}</span>
            <span>
              工资详情：金团工资 {formatGold(raidRun.totalIncome)}，团队补贴{' '}
              {formatGold(raidRun.subsidyAmount)}，个人工资{' '}
              {formatGold(raidRun.wagePerPerson)}
            </span>
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setGameRaidIdOpen(true)}
            >
              记录副本ID
            </Button>
            <Button type="button" size="sm" onClick={() => setWagesOpen(true)}>
              记录工资
            </Button>
            <Button type="button" size="sm" variant="outline">
              添加掉落
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">暂无掉落</p>
      </CardContent>
      <RecordGameRaidIdDialogComponent
        open={gameRaidIdOpen}
        pending={gameRaidIdMutation.isPending}
        initialGameRaidId={raidRun.gameRaidId}
        onOpenChange={setGameRaidIdOpen}
        onSubmit={(gameRaidId) => gameRaidIdMutation.mutate(gameRaidId)}
      />
      <RecordWageDialogComponent
        open={wagesOpen}
        pending={wagesMutation.isPending}
        initialWages={{
          totalIncome: raidRun.totalIncome,
          subsidyAmount: raidRun.subsidyAmount,
          wagePerPerson: raidRun.wagePerPerson,
        }}
        wageShareCount={countRaidRunWageShareSignups(raidRun)}
        onOpenChange={setWagesOpen}
        onSubmit={(values) => wagesMutation.mutate(values)}
      />
    </Card>
  );
};

export default RaidLootPanel;
