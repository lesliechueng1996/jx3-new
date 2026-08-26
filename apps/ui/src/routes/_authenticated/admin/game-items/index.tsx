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
  type AdminGameItemFormValues,
  type AdminGameItemListItem,
  adminCreateGameItem,
  adminDeleteGameItem,
  adminListGameItems,
  adminReplaceGameItemLoot,
  adminUpdateGameItem,
} from '@/lib/api/admin/admin-game-items-api';
import { createGameItemQuick } from '@/lib/api/game-items-api';
import { handleApiError } from '@/lib/api-client';
import { GameItemCreateDialogComponent } from './-components/GameItemCreateDialogComponent';
import { GameItemEditDialogComponent } from './-components/GameItemEditDialogComponent';
import { GameItemFiltersComponent } from './-components/GameItemFiltersComponent';
import { GameItemQuickCreateDialogComponent } from './-components/GameItemQuickCreateDialogComponent';
import { GameItemReplaceDialogComponent } from './-components/GameItemReplaceDialogComponent';
import { GameItemTableComponent } from './-components/GameItemTableComponent';
import {
  defaultGameItemsSearch,
  gameItemsSearchSchema,
  toListGameItemsFilters,
} from './-lib/game-items-schema';

export const Route = createFileRoute('/_authenticated/admin/game-items/')({
  component: GameItemsComponent,
  validateSearch: gameItemsSearchSchema,
});

const gameItemsAdminQueryKey = ['admin-game-items'];

function GameItemsComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [quickCreating, setQuickCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminGameItemListItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] =
    useState<AdminGameItemListItem | null>(null);
  const [replacingItem, setReplacingItem] =
    useState<AdminGameItemListItem | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: gameItemsAdminQueryKey,
    search,
    defaults: defaultGameItemsSearch,
    navigate,
    queryFn: (nextSearch) =>
      adminListGameItems(toListGameItemsFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateGameItem,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '物品已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建物品失败'),
  });

  const quickCreateMutation = useMutation({
    mutationFn: createGameItemQuick,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '物品已创建',
      });
      setQuickCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建物品失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      item,
    }: {
      itemId: string;
      item: AdminGameItemFormValues;
    }) => adminUpdateGameItem(itemId, item),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '物品信息已更新',
      });
      setEditingItem(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新物品失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => adminDeleteGameItem(itemId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '物品已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除物品失败'),
    onSettled: () => setPendingItemId(null),
  });

  const replaceMutation = useMutation({
    mutationFn: ({
      sourceItemId,
      targetItemId,
    }: {
      sourceItemId: string;
      targetItemId: string;
    }) => adminReplaceGameItemLoot(sourceItemId, targetItemId),
    onSuccess: async (result) => {
      toast.add({
        type: 'success',
        title: `已替换 ${result.replacedCount} 条掉落记录`,
      });
      setReplacingItem(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '替换物品失败'),
    onSettled: () => setPendingItemId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <GameItemFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setQuickCreating(true)}
        >
          快速添加
        </Button>
        <Button type="button" onClick={() => setCreating(true)}>
          新增物品
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载物品列表失败，请稍后重试。" />
      ) : null}

      <GameItemTableComponent
        items={items}
        isLoading={isFetching}
        pendingItemId={pendingItemId}
        onEdit={setEditingItem}
        onReplace={setReplacingItem}
        onDelete={setDeletingItem}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null);
          }
        }}
        title="删除物品"
        description={
          deletingItem
            ? `确定删除物品「${deletingItem.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingItem) {
            return;
          }
          setPendingItemId(deletingItem.id);
          deleteMutation.mutate(deletingItem.id);
        }}
      />

      <GameItemReplaceDialogComponent
        item={replacingItem}
        open={replacingItem !== null}
        pending={replaceMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setReplacingItem(null);
          }
        }}
        onConfirm={(targetItemId) => {
          if (!replacingItem) {
            return;
          }
          setPendingItemId(replacingItem.id);
          replaceMutation.mutate({
            sourceItemId: replacingItem.id,
            targetItemId,
          });
        }}
      />

      <GameItemQuickCreateDialogComponent
        open={quickCreating}
        pending={quickCreateMutation.isPending}
        onOpenChange={setQuickCreating}
        onSubmit={(values) => quickCreateMutation.mutate(values)}
      />

      <GameItemCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminGameItemFormValues) =>
          createMutation.mutate(values)
        }
      />

      <GameItemEditDialogComponent
        item={editingItem}
        open={editingItem !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingItem) {
            return;
          }
          updateMutation.mutate({
            itemId: editingItem.id,
            item: values,
          });
        }}
      />
    </section>
  );
}
