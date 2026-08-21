import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  type AdminGameExpansionFormValues,
  type AdminGameExpansionListItem,
  adminCreateGameExpansion,
  adminDeleteGameExpansion,
  adminListGameExpansions,
  adminUpdateGameExpansion,
} from '@/lib/api/admin/admin-game-expansions-api';
import {
  type AdminGameSeasonFormValues,
  type AdminGameSeasonListItem,
  adminCreateGameSeason,
  adminDeleteGameSeason,
  adminListGameSeasons,
  adminUpdateGameSeason,
} from '@/lib/api/admin/admin-game-seasons-api';
import { handleApiError } from '@/lib/api-client';
import { GameExpansionCreateDialogComponent } from './-components/GameExpansionCreateDialogComponent';
import { GameExpansionEditDialogComponent } from './-components/GameExpansionEditDialogComponent';
import { GameExpansionTableComponent } from './-components/GameExpansionTableComponent';
import { GameSeasonCreateDialogComponent } from './-components/GameSeasonCreateDialogComponent';
import { GameSeasonEditDialogComponent } from './-components/GameSeasonEditDialogComponent';
import { GameSeasonTableComponent } from './-components/GameSeasonTableComponent';

export const Route = createFileRoute('/_authenticated/admin/game-expansions/')({
  component: GameExpansionsComponent,
});

const gameExpansionsAdminQueryKey = ['admin-game-expansions'];

const gameSeasonsAdminQueryKey = (expansionId: string) => [
  'admin-game-seasons',
  expansionId,
];

function GameExpansionsComponent() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingExpansion, setEditingExpansion] =
    useState<AdminGameExpansionListItem | null>(null);
  const [deletingExpansion, setDeletingExpansion] =
    useState<AdminGameExpansionListItem | null>(null);
  const [pendingExpansionId, setPendingExpansionId] = useState<string | null>(
    null,
  );
  const [expandedExpansionId, setExpandedExpansionId] = useState<string | null>(
    null,
  );
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [editingSeason, setEditingSeason] =
    useState<AdminGameSeasonListItem | null>(null);
  const [deletingSeason, setDeletingSeason] =
    useState<AdminGameSeasonListItem | null>(null);
  const [pendingSeasonId, setPendingSeasonId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: gameExpansionsAdminQueryKey,
    queryFn: adminListGameExpansions,
  });

  const seasonsQuery = useQuery({
    queryKey: gameSeasonsAdminQueryKey(expandedExpansionId ?? ''),
    queryFn: () => adminListGameSeasons(expandedExpansionId ?? ''),
    enabled: Boolean(expandedExpansionId),
  });

  const invalidateExpansions = () =>
    queryClient.invalidateQueries({ queryKey: gameExpansionsAdminQueryKey });

  const invalidateSeasons = (expansionId: string) =>
    queryClient.invalidateQueries({
      queryKey: gameSeasonsAdminQueryKey(expansionId),
    });

  const createMutation = useMutation({
    mutationFn: adminCreateGameExpansion,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '资料片已创建',
      });
      setCreating(false);
      await invalidateExpansions();
    },
    onError: (error) => handleApiError(error, '创建资料片失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      expansionId,
      expansion,
    }: {
      expansionId: string;
      expansion: AdminGameExpansionFormValues;
    }) => adminUpdateGameExpansion(expansionId, expansion),
    onSuccess: async (_result, variables) => {
      toast.add({
        type: 'success',
        title: '资料片信息已更新',
      });
      setEditingExpansion(null);
      await invalidateExpansions();
      await invalidateSeasons(variables.expansionId);
    },
    onError: (error) => handleApiError(error, '更新资料片失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (expansionId: string) => adminDeleteGameExpansion(expansionId),
    onSuccess: async (_result, expansionId) => {
      toast.add({
        type: 'success',
        title: '资料片已删除',
      });
      if (expandedExpansionId === expansionId) {
        setExpandedExpansionId(null);
      }
      await invalidateExpansions();
    },
    onError: (error) => handleApiError(error, '删除资料片失败'),
    onSettled: () => setPendingExpansionId(null),
  });

  const createSeasonMutation = useMutation({
    mutationFn: adminCreateGameSeason,
    onSuccess: async (_result, variables) => {
      toast.add({
        type: 'success',
        title: '赛季已创建',
      });
      setCreatingSeason(false);
      await invalidateSeasons(variables.expansionId);
    },
    onError: (error) => handleApiError(error, '创建赛季失败'),
  });

  const updateSeasonMutation = useMutation({
    mutationFn: ({
      seasonId,
      season,
    }: {
      seasonId: string;
      season: Omit<AdminGameSeasonFormValues, 'expansionId'>;
    }) => adminUpdateGameSeason(seasonId, season),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '赛季信息已更新',
      });
      setEditingSeason(null);
      if (expandedExpansionId) {
        await invalidateSeasons(expandedExpansionId);
      }
    },
    onError: (error) => handleApiError(error, '更新赛季失败'),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (seasonId: string) => adminDeleteGameSeason(seasonId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '赛季已删除',
      });
      if (expandedExpansionId) {
        await invalidateSeasons(expandedExpansionId);
      }
    },
    onError: (error) => handleApiError(error, '删除赛季失败'),
    onSettled: () => setPendingSeasonId(null),
  });

  const expandedExpansion =
    listQuery.data?.items.find((item) => item.id === expandedExpansionId) ??
    null;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">资料片管理</h1>
        <p className="text-sm text-muted-foreground">维护游戏资料片及其赛季</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={() => setCreating(true)}>
          新增资料片
        </Button>
      </div>

      {listQuery.isError ? (
        <ErrorAlert
          title="错误"
          description="加载资料片列表失败，请稍后重试。"
        />
      ) : null}

      <GameExpansionTableComponent
        items={listQuery.data?.items ?? []}
        isLoading={listQuery.isFetching}
        pendingExpansionId={pendingExpansionId}
        expandedExpansionId={expandedExpansionId}
        onToggleExpand={(expansion) => {
          setExpandedExpansionId((current) =>
            current === expansion.id ? null : expansion.id,
          );
        }}
        onEdit={setEditingExpansion}
        onDelete={setDeletingExpansion}
        renderExpanded={(expansion) => (
          <div className="flex flex-col gap-3">
            {seasonsQuery.isError ? (
              <ErrorAlert
                title="错误"
                description="加载赛季列表失败，请稍后重试。"
              />
            ) : null}
            <GameSeasonTableComponent
              expansion={expansion}
              items={seasonsQuery.data?.items ?? []}
              isLoading={seasonsQuery.isFetching}
              pendingSeasonId={pendingSeasonId}
              onCreate={() => setCreatingSeason(true)}
              onEdit={setEditingSeason}
              onDelete={setDeletingSeason}
            />
          </div>
        )}
      />

      <ConfirmDialog
        open={deletingExpansion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingExpansion(null);
          }
        }}
        title="删除资料片"
        description={
          deletingExpansion
            ? `确定删除资料片「${deletingExpansion.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingExpansion) {
            return;
          }
          setPendingExpansionId(deletingExpansion.id);
          deleteMutation.mutate(deletingExpansion.id);
        }}
      />

      <ConfirmDialog
        open={deletingSeason !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSeason(null);
          }
        }}
        title="删除赛季"
        description={
          deletingSeason
            ? `确定删除赛季「${deletingSeason.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteSeasonMutation.isPending}
        onConfirm={() => {
          if (!deletingSeason) {
            return;
          }
          setPendingSeasonId(deletingSeason.id);
          deleteSeasonMutation.mutate(deletingSeason.id);
        }}
      />

      <GameExpansionCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminGameExpansionFormValues) =>
          createMutation.mutate(values)
        }
      />

      <GameExpansionEditDialogComponent
        expansion={editingExpansion}
        open={editingExpansion !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingExpansion(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingExpansion) {
            return;
          }
          updateMutation.mutate({
            expansionId: editingExpansion.id,
            expansion: values,
          });
        }}
      />

      <GameSeasonCreateDialogComponent
        expansionId={expandedExpansion?.id ?? null}
        open={creatingSeason}
        pending={createSeasonMutation.isPending}
        onOpenChange={setCreatingSeason}
        onSubmit={(values: AdminGameSeasonFormValues) =>
          createSeasonMutation.mutate(values)
        }
      />

      <GameSeasonEditDialogComponent
        season={editingSeason}
        open={editingSeason !== null}
        pending={updateSeasonMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSeason(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingSeason) {
            return;
          }
          updateSeasonMutation.mutate({
            seasonId: editingSeason.id,
            season: values,
          });
        }}
      />
    </section>
  );
}
