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
  type AdminKungfuFormValues,
  type AdminKungfuListItem,
  adminCreateKungfu,
  adminDeleteKungfu,
  adminListKungfus,
  adminUpdateKungfu,
} from '@/lib/api/admin/admin-kungfus-api';
import { handleApiError } from '@/lib/api-client';
import { KungfuCreateDialogComponent } from './-components/KungfuCreateDialogComponent';
import { KungfuEditDialogComponent } from './-components/KungfuEditDialogComponent';
import { KungfuFiltersComponent } from './-components/KungfuFiltersComponent';
import { KungfuTableComponent } from './-components/KungfuTableComponent';
import {
  defaultKungfusSearch,
  kungfusSearchSchema,
  toListKungfusFilters,
} from './-lib/kungfus-schema';

export const Route = createFileRoute('/_authenticated/admin/kungfus/')({
  component: KungfusComponent,
  validateSearch: kungfusSearchSchema,
});

const kungfusAdminQueryKey = ['admin-kungfus'];

function KungfusComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [editingKungfu, setEditingKungfu] =
    useState<AdminKungfuListItem | null>(null);
  const [deletingKungfu, setDeletingKungfu] =
    useState<AdminKungfuListItem | null>(null);
  const [pendingKungfuId, setPendingKungfuId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: kungfusAdminQueryKey,
    search,
    defaults: defaultKungfusSearch,
    navigate,
    queryFn: (nextSearch) => adminListKungfus(toListKungfusFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateKungfu,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '心法已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建心法失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      kungfuId,
      kungfu,
    }: {
      kungfuId: string;
      kungfu: AdminKungfuFormValues;
    }) => adminUpdateKungfu(kungfuId, kungfu),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '心法信息已更新',
      });
      setEditingKungfu(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新心法失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (kungfuId: string) => adminDeleteKungfu(kungfuId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '心法已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除心法失败'),
    onSettled: () => setPendingKungfuId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <KungfuFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新增心法
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载心法列表失败，请稍后重试。" />
      ) : null}

      <KungfuTableComponent
        items={items}
        isLoading={isFetching}
        pendingKungfuId={pendingKungfuId}
        onEdit={setEditingKungfu}
        onDelete={setDeletingKungfu}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingKungfu !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingKungfu(null);
          }
        }}
        title="删除心法"
        description={
          deletingKungfu
            ? `确定删除心法「${deletingKungfu.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingKungfu) {
            return;
          }
          setPendingKungfuId(deletingKungfu.id);
          deleteMutation.mutate(deletingKungfu.id);
        }}
      />

      <KungfuCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminKungfuFormValues) =>
          createMutation.mutate(values)
        }
      />

      <KungfuEditDialogComponent
        kungfu={editingKungfu}
        open={editingKungfu !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingKungfu(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingKungfu) {
            return;
          }
          updateMutation.mutate({
            kungfuId: editingKungfu.id,
            kungfu: values,
          });
        }}
      />
    </section>
  );
}
