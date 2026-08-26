import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminRaidRunListItem,
  adminCopyRaidRun,
  adminDeleteRaidRun,
  adminListRaidRuns,
} from '@/lib/api/admin/admin-raid-runs-api';
import { handleApiError } from '@/lib/api-client';
import { RaidRunFiltersComponent } from './-components/RaidRunFiltersComponent';
import { RaidRunTableComponent } from './-components/RaidRunTableComponent';
import {
  defaultRaidRunsSearch,
  raidRunsSearchSchema,
  toListRaidRunsFilters,
} from './-lib/raid-runs-schema';

export const Route = createFileRoute('/_authenticated/admin/raid-runs/')({
  component: RaidRunsComponent,
  validateSearch: raidRunsSearchSchema,
});

const raidRunsAdminQueryKey = ['admin-raid-runs'];

function RaidRunsComponent() {
  const navigate = useNavigate();
  const routeNavigate = Route.useNavigate();
  const search = Route.useSearch();
  const [deletingRaidRun, setDeletingRaidRun] =
    useState<AdminRaidRunListItem | null>(null);
  const [copyingRaidRun, setCopyingRaidRun] =
    useState<AdminRaidRunListItem | null>(null);
  const [pendingRaidRunId, setPendingRaidRunId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: raidRunsAdminQueryKey,
    search,
    defaults: defaultRaidRunsSearch,
    navigate: routeNavigate,
    queryFn: (nextSearch) =>
      adminListRaidRuns(toListRaidRunsFilters(nextSearch)),
  });

  const deleteMutation = useMutation({
    mutationFn: (raidRunId: string) => adminDeleteRaidRun(raidRunId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '开团已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除开团失败'),
    onSettled: () => setPendingRaidRunId(null),
  });

  const copyMutation = useMutation({
    mutationFn: (raidRunId: string) => adminCopyRaidRun(raidRunId),
    onSuccess: (result) => {
      toast.add({
        type: 'success',
        title: '开团已复制',
      });
      void invalidate();
      navigate({
        to: '/raid-run/$id',
        params: { id: result.id },
      });
    },
    onError: (error) => handleApiError(error, '复制开团失败'),
    onSettled: () => setPendingRaidRunId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <RaidRunFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => navigate({ to: '/raid-run' })}>
          新建开团
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载开团列表失败，请稍后重试。" />
      ) : null}

      <RaidRunTableComponent
        items={items}
        isLoading={isFetching}
        pendingRaidRunId={pendingRaidRunId}
        onEdit={(raidRun) =>
          navigate({
            to: '/raid-run/$id',
            params: { id: raidRun.id },
          })
        }
        onCopy={setCopyingRaidRun}
        onDelete={setDeletingRaidRun}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={copyingRaidRun !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCopyingRaidRun(null);
          }
        }}
        title="复制开团"
        description="确定复制这个开团吗？"
        confirmLabel="复制"
        pending={copyMutation.isPending}
        onConfirm={() => {
          if (!copyingRaidRun) {
            return;
          }
          setPendingRaidRunId(copyingRaidRun.id);
          copyMutation.mutate(copyingRaidRun.id);
        }}
      />

      <ConfirmDialog
        open={deletingRaidRun !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRaidRun(null);
          }
        }}
        title="删除开团"
        description={
          deletingRaidRun
            ? `确定删除开团「${deletingRaidRun.name}」吗？将同时删除该开团下的报名和掉落记录，此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingRaidRun) {
            return;
          }
          setPendingRaidRunId(deletingRaidRun.id);
          deleteMutation.mutate(deletingRaidRun.id);
        }}
      />
    </section>
  );
}
