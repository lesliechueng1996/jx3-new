import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminIdiomEditFormValues,
  type AdminIdiomListItem,
  adminCreateIdiom,
  adminDeleteIdiom,
  adminGetIdiomDetail,
  adminListIdiomsPagination,
  adminUpdateIdiom,
} from '@/lib/api/admin/admin-idioms-api';
import { handleApiError } from '@/lib/api-client';
import { IdiomCreateDialogComponent } from './-components/IdiomCreateDialogComponent';
import { IdiomEditDialogComponent } from './-components/IdiomEditDialogComponent';
import IdiomFiltersComponent from './-components/IdiomFiltersComponent';
import { IdiomTableComponent } from './-components/IdiomTableComponent';
import { defaultIdiomsSearch, idiomsSearchSchema } from './-lib/idioms-schema';

export const Route = createFileRoute('/_authenticated/admin/idioms/')({
  component: IdiomsComponent,
  validateSearch: idiomsSearchSchema,
});

const idiomsAdminQueryKey = ['admin-idioms'];

function IdiomsComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [, setImporting] = useState(false);

  const [editingIdiom, setEditingIdiom] = useState<AdminIdiomListItem | null>(
    null,
  );
  const [pendingIdiomId, setPendingIdiomId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: idiomsAdminQueryKey,
    search,
    defaults: defaultIdiomsSearch,
    navigate,
    queryFn: adminListIdiomsPagination,
  });

  const idiomDetailQuery = useQuery({
    queryKey: [...idiomsAdminQueryKey, 'detail', editingIdiom?.id],
    queryFn: () => adminGetIdiomDetail(editingIdiom?.id ?? ''),
    enabled: editingIdiom !== null,
  });

  const createMutation = useMutation({
    mutationFn: adminCreateIdiom,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '成语已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建成语失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      idiomId,
      idiom,
    }: {
      idiomId: string;
      idiom: AdminIdiomEditFormValues;
    }) => adminUpdateIdiom(idiomId, idiom),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '成语信息已更新',
      });
      setEditingIdiom(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新成语失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idiomId: string) => adminDeleteIdiom(idiomId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '成语已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除成语失败'),
    onSettled: () => setPendingIdiomId(null),
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">成语管理</h1>
        <p className="text-sm text-muted-foreground">
          维护成语库及逐字读音信息
        </p>
      </div>

      <IdiomFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setImporting(true)}
        >
          导入成语
        </Button>
        <Button type="button" onClick={() => setCreating(true)}>
          新增成语
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载成语列表失败，请稍后重试。" />
      ) : null}

      <IdiomTableComponent
        items={items}
        isLoading={isFetching}
        pendingIdiomId={pendingIdiomId}
        onEdit={setEditingIdiom}
        onDelete={(idiom) => {
          if (!window.confirm(`确定删除成语「${idiom.text}」吗？`)) {
            return;
          }
          setPendingIdiomId(idiom.id);
          deleteMutation.mutate(idiom.id);
        }}
      />

      <Pagination {...paginationProps} />

      <IdiomCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <IdiomEditDialogComponent
        idiom={idiomDetailQuery.data ?? null}
        open={editingIdiom !== null}
        pending={updateMutation.isPending || idiomDetailQuery.isFetching}
        onOpenChange={(open) => {
          if (!open) {
            setEditingIdiom(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingIdiom) {
            return;
          }
          updateMutation.mutate({
            idiomId: editingIdiom.id,
            idiom: values,
          });
        }}
      />
    </section>
  );
}
