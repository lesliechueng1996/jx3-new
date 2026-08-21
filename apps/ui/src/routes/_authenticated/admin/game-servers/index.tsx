import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import {
  type AdminGameServerFormValues,
  type AdminGameServerListItem,
  adminCreateGameServer,
  adminDeleteGameServer,
  adminListGameServers,
  adminSyncGameServers,
  adminUpdateGameServer,
} from '@/lib/api/admin/admin-game-servers-api';
import { handleApiError } from '@/lib/api-client';
import { GameServerCreateDialogComponent } from './-components/GameServerCreateDialogComponent';
import { GameServerEditDialogComponent } from './-components/GameServerEditDialogComponent';
import { GameServerTableComponent } from './-components/GameServerTableComponent';

export const Route = createFileRoute('/_authenticated/admin/game-servers/')({
  component: GameServersComponent,
});

const gameServersAdminQueryKey = ['admin-game-servers'];

function GameServersComponent() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingGameServer, setEditingGameServer] =
    useState<AdminGameServerListItem | null>(null);
  const [deletingGameServer, setDeletingGameServer] =
    useState<AdminGameServerListItem | null>(null);
  const [pendingGameServerId, setPendingGameServerId] = useState<string | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: gameServersAdminQueryKey,
    queryFn: adminListGameServers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: gameServersAdminQueryKey });

  const createMutation = useMutation({
    mutationFn: adminCreateGameServer,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '区服已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建区服失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      gameServerId,
      gameServer,
    }: {
      gameServerId: string;
      gameServer: AdminGameServerFormValues;
    }) => adminUpdateGameServer(gameServerId, gameServer),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '区服信息已更新',
      });
      setEditingGameServer(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新区服失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (gameServerId: string) => adminDeleteGameServer(gameServerId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '区服已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除区服失败'),
    onSettled: () => setPendingGameServerId(null),
  });

  const syncMutation = useMutation({
    mutationFn: adminSyncGameServers,
    onSuccess: async (result) => {
      toast.add({
        type: 'success',
        title: `同步完成：更新 ${result.updatedCount} 条，新增 ${result.insertedCount} 条`,
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '同步区服失败'),
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">区服管理</h1>
        <p className="text-sm text-muted-foreground">维护游戏大区与服务器</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
          同步服务器
        </Button>
        <Button type="button" onClick={() => setCreating(true)}>
          新增区服
        </Button>
      </div>

      {listQuery.isError ? (
        <ErrorAlert title="错误" description="加载区服列表失败，请稍后重试。" />
      ) : null}

      <GameServerTableComponent
        items={listQuery.data?.items ?? []}
        isLoading={listQuery.isFetching}
        pendingGameServerId={pendingGameServerId}
        onEdit={setEditingGameServer}
        onDelete={setDeletingGameServer}
      />

      <ConfirmDialog
        open={deletingGameServer !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingGameServer(null);
          }
        }}
        title="删除区服"
        description={
          deletingGameServer
            ? `确定删除区服「${deletingGameServer.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingGameServer) {
            return;
          }
          setPendingGameServerId(deletingGameServer.id);
          deleteMutation.mutate(deletingGameServer.id);
        }}
      />

      <GameServerCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminGameServerFormValues) =>
          createMutation.mutate(values)
        }
      />

      <GameServerEditDialogComponent
        gameServer={editingGameServer}
        open={editingGameServer !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGameServer(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingGameServer) {
            return;
          }
          updateMutation.mutate({
            gameServerId: editingGameServer.id,
            gameServer: values,
          });
        }}
      />
    </section>
  );
}
