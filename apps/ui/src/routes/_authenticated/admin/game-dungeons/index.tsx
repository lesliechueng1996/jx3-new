import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminGameDungeonFormValues,
  type AdminGameDungeonListItem,
  adminCreateGameDungeon,
  adminDeleteGameDungeon,
  adminListGameDungeons,
  adminUpdateGameDungeon,
} from '@/lib/api/admin/admin-game-dungeons-api';
import { handleApiError } from '@/lib/api-client';
import { GameDungeonCreateDialogComponent } from './-components/GameDungeonCreateDialogComponent';
import { GameDungeonEditDialogComponent } from './-components/GameDungeonEditDialogComponent';
import { GameDungeonFiltersComponent } from './-components/GameDungeonFiltersComponent';
import { GameDungeonTableComponent } from './-components/GameDungeonTableComponent';
import {
  defaultGameDungeonsSearch,
  gameDungeonsSearchSchema,
  toListGameDungeonsFilters,
} from './-lib/game-dungeons-schema';

export const Route = createFileRoute('/_authenticated/admin/game-dungeons/')({
  component: GameDungeonsComponent,
  validateSearch: gameDungeonsSearchSchema,
});

const gameDungeonsAdminQueryKey = ['admin-game-dungeons'];

function GameDungeonsComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [editingDungeon, setEditingDungeon] =
    useState<AdminGameDungeonListItem | null>(null);
  const [deletingDungeon, setDeletingDungeon] =
    useState<AdminGameDungeonListItem | null>(null);
  const [pendingDungeonId, setPendingDungeonId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: gameDungeonsAdminQueryKey,
    search,
    defaults: defaultGameDungeonsSearch,
    navigate,
    queryFn: (nextSearch) =>
      adminListGameDungeons(toListGameDungeonsFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateGameDungeon,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '副本已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建副本失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      dungeonId,
      dungeon,
    }: {
      dungeonId: string;
      dungeon: AdminGameDungeonFormValues;
    }) => adminUpdateGameDungeon(dungeonId, dungeon),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '副本信息已更新',
      });
      setEditingDungeon(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新副本失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (dungeonId: string) => adminDeleteGameDungeon(dungeonId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '副本已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除副本失败'),
    onSettled: () => setPendingDungeonId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">副本管理</h1>
        <p className="text-sm text-muted-foreground">
          维护游戏副本与每周刷新日
        </p>
      </div>

      <GameDungeonFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新增副本
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载副本列表失败，请稍后重试。" />
      ) : null}

      <GameDungeonTableComponent
        items={items}
        isLoading={isFetching}
        pendingDungeonId={pendingDungeonId}
        onEdit={setEditingDungeon}
        onDelete={setDeletingDungeon}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingDungeon !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingDungeon(null);
          }
        }}
        title="删除副本"
        description={
          deletingDungeon
            ? `确定删除副本「${deletingDungeon.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingDungeon) {
            return;
          }
          setPendingDungeonId(deletingDungeon.id);
          deleteMutation.mutate(deletingDungeon.id);
        }}
      />

      <GameDungeonCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminGameDungeonFormValues) =>
          createMutation.mutate(values)
        }
      />

      <GameDungeonEditDialogComponent
        dungeon={editingDungeon}
        open={editingDungeon !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDungeon(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingDungeon) {
            return;
          }
          updateMutation.mutate({
            dungeonId: editingDungeon.id,
            dungeon: values,
          });
        }}
      />
    </section>
  );
}
