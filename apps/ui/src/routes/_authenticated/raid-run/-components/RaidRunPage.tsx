import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { kungfusAllQueryKey, listAllKungfus } from '@/lib/api/kungfus-api';
import {
  createRaidRun,
  getRaidRun,
  raidRunDetailQueryKey,
  saveRaidRun,
  updateRaidRunStatus,
} from '@/lib/api/raid-runs-api';
import { handleApiError } from '@/lib/api-client';
import { useRaidRun } from '../-hook/use-raid-run';
import { setRaidRunStatus } from '../-lib/raid-run';
import {
  raidRunFromDetail,
  raidRunSaveSnapshot,
  toRaidRunSaveBody,
  validateRaidRunForSave,
} from '../-lib/raid-run-save';
import RaidLootPanel from './RaidLootPanel';
import RaidMemberPanel from './RaidMemberPanel';
import RaidRunActionBarComponent from './RaidRunActionBarComponent';
import RaidRunInfo from './RaidRunInfo';
import RaidTeamLayout from './RaidTeamLayout';

type Props = {
  raidRunId?: string;
};

const RaidRunPage = ({ raidRunId }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    raidRun,
    savedSnapshot,
    hydrateRaidRun,
    resetRaidRun,
    updateRaidRun,
  } = useRaidRun();
  const isDirty = raidRunSaveSnapshot(raidRun) !== savedSnapshot;

  const kungfusQuery = useQuery({
    queryKey: kungfusAllQueryKey,
    queryFn: listAllKungfus,
  });

  const detailQuery = useQuery({
    queryKey: raidRunId
      ? raidRunDetailQueryKey(raidRunId)
      : ['raid-run', 'new'],
    queryFn: () => getRaidRun(raidRunId ?? ''),
    enabled: Boolean(raidRunId),
  });

  useEffect(() => {
    if (!raidRunId) {
      resetRaidRun();
    }
  }, [raidRunId, resetRaidRun]);

  useEffect(() => {
    if (detailQuery.data) {
      hydrateRaidRun(raidRunFromDetail(detailQuery.data));
    }
  }, [detailQuery.data, hydrateRaidRun]);

  const persist = async () => {
    const message = validateRaidRunForSave(raidRun, {
      kungfus: kungfusQuery.data,
    });
    if (message) {
      toast.add({
        type: 'error',
        description: message,
      });
      return undefined;
    }

    const body = toRaidRunSaveBody(raidRun, {
      includeSignupIds: Boolean(raidRunId),
    });

    if (!raidRunId) {
      return createRaidRun(body);
    }

    return saveRaidRun(raidRunId, body);
  };

  const saveMutation = useMutation({
    mutationFn: persist,
    onSuccess: async (detail) => {
      if (!detail) {
        return;
      }

      queryClient.setQueryData(raidRunDetailQueryKey(detail.id), detail);
      hydrateRaidRun(raidRunFromDetail(detail));
      toast.add({
        type: 'success',
        title: raidRunId ? '已保存' : '已暂存',
      });

      if (!raidRunId) {
        await navigate({
          to: '/raid-run/$id',
          params: { id: detail.id },
        });
      }
    },
    onError: (error) =>
      handleApiError(error, raidRunId ? '保存开团失败' : '暂存开团失败'),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const detail = await persist();
      if (!detail) {
        return undefined;
      }

      const status = await updateRaidRunStatus(detail.id, 'recruiting');
      return {
        ...detail,
        status: status.status,
      };
    },
    onSuccess: async (detail) => {
      if (!detail) {
        return;
      }

      queryClient.setQueryData(raidRunDetailQueryKey(detail.id), detail);
      hydrateRaidRun(raidRunFromDetail(detail));
      toast.add({
        type: 'success',
        title: '已发布开团',
      });

      if (!raidRunId) {
        await navigate({
          to: '/raid-run/$id',
          params: { id: detail.id },
        });
      }
    },
    onError: (error) => handleApiError(error, '发布开团失败'),
  });

  const startMutation = useMutation({
    mutationFn: () => updateRaidRunStatus(raidRunId as string, 'ongoing'),
    onSuccess: (data) => {
      updateRaidRun((run) => setRaidRunStatus(run, data.status));
      toast.add({
        type: 'success',
        title: '团本已开始',
      });
    },
    onError: (error) => handleApiError(error, '开始团本失败'),
  });

  const completeMutation = useMutation({
    mutationFn: () => updateRaidRunStatus(raidRunId as string, 'completed'),
    onSuccess: (data) => {
      updateRaidRun((run) => setRaidRunStatus(run, data.status));
      toast.add({
        type: 'success',
        title: '团本已完成',
      });
    },
    onError: (error) => handleApiError(error, '完成团本失败'),
  });

  const isPending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending;

  if (raidRunId && detailQuery.isLoading) {
    return <p className="text-muted-foreground">加载中…</p>;
  }

  if (raidRunId && detailQuery.isError) {
    return (
      <p className="text-destructive">
        {detailQuery.error instanceof Error
          ? detailQuery.error.message
          : '获取开团失败'}
      </p>
    );
  }

  return (
    <section className="flex w-full min-w-0 flex-col gap-6">
      <RaidRunActionBarComponent
        status={raidRun.status}
        isDirty={isDirty}
        isPending={isPending}
        onSave={() => saveMutation.mutate()}
        onPublish={() => publishMutation.mutate()}
        onStart={() => startMutation.mutate()}
        onComplete={() => completeMutation.mutate()}
      />
      <div className="flex w-full min-w-0 items-start gap-4">
        <RaidRunInfo className="w-72 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <RaidTeamLayout />
          <RaidLootPanel />
        </div>
        <RaidMemberPanel className="w-72 shrink-0" />
      </div>
    </section>
  );
};

export default RaidRunPage;
