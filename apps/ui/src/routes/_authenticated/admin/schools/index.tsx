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
  type AdminSchoolFormValues,
  type AdminSchoolListItem,
  adminCreateSchool,
  adminDeleteSchool,
  adminListSchools,
  adminUpdateSchool,
} from '@/lib/api/admin/admin-schools-api';
import { handleApiError } from '@/lib/api-client';
import { SchoolCreateDialogComponent } from './-components/SchoolCreateDialogComponent';
import { SchoolEditDialogComponent } from './-components/SchoolEditDialogComponent';
import { SchoolFiltersComponent } from './-components/SchoolFiltersComponent';
import { SchoolTableComponent } from './-components/SchoolTableComponent';
import {
  defaultSchoolsSearch,
  schoolsSearchSchema,
  toListSchoolsFilters,
} from './-lib/schools-schema';

export const Route = createFileRoute('/_authenticated/admin/schools/')({
  component: SchoolsComponent,
  validateSearch: schoolsSearchSchema,
});

const schoolsAdminQueryKey = ['admin-schools'];

function SchoolsComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [editingSchool, setEditingSchool] =
    useState<AdminSchoolListItem | null>(null);
  const [deletingSchool, setDeletingSchool] =
    useState<AdminSchoolListItem | null>(null);
  const [pendingSchoolId, setPendingSchoolId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: schoolsAdminQueryKey,
    search,
    defaults: defaultSchoolsSearch,
    navigate,
    queryFn: (nextSearch) => adminListSchools(toListSchoolsFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateSchool,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '门派已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建门派失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      schoolId,
      school,
    }: {
      schoolId: string;
      school: AdminSchoolFormValues;
    }) => adminUpdateSchool(schoolId, school),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '门派信息已更新',
      });
      setEditingSchool(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新门派失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (schoolId: string) => adminDeleteSchool(schoolId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '门派已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除门派失败'),
    onSettled: () => setPendingSchoolId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">门派管理</h1>
        <p className="text-sm text-muted-foreground">维护游戏门派与流派</p>
      </div>

      <SchoolFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新增门派
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载门派列表失败，请稍后重试。" />
      ) : null}

      <SchoolTableComponent
        items={items}
        isLoading={isFetching}
        pendingSchoolId={pendingSchoolId}
        onEdit={setEditingSchool}
        onDelete={setDeletingSchool}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingSchool !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSchool(null);
          }
        }}
        title="删除门派"
        description={
          deletingSchool
            ? `确定删除门派「${deletingSchool.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingSchool) {
            return;
          }
          setPendingSchoolId(deletingSchool.id);
          deleteMutation.mutate(deletingSchool.id);
        }}
      />

      <SchoolCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminSchoolFormValues) =>
          createMutation.mutate(values)
        }
      />

      <SchoolEditDialogComponent
        school={editingSchool}
        open={editingSchool !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSchool(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingSchool) {
            return;
          }
          updateMutation.mutate({
            schoolId: editingSchool.id,
            school: values,
          });
        }}
      />
    </section>
  );
}
