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
  type AdminUserBanFormValues,
  type AdminUserCreateFormValues,
  type AdminUserEditFormValues,
  type AdminUserListItem,
  adminBanUser,
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminUnbanUser,
  adminUpdateUser,
} from '@/lib/api/admin/admin-users-api';
import { handleApiError } from '@/lib/api-client';
import { UserBanDialogComponent } from './-components/UserBanDialogComponent';
import { UserCreateDialogComponent } from './-components/UserCreateDialogComponent';
import { UserEditDialogComponent } from './-components/UserEditDialogComponent';
import { UserFiltersComponent } from './-components/UserFiltersComponent';
import { UserTableComponent } from './-components/UserTableComponent';
import {
  defaultUsersSearch,
  toListUsersFilters,
  usersSearchSchema,
} from './-lib/users-schema';

export const Route = createFileRoute('/_authenticated/admin/users/')({
  component: UsersComponent,
  validateSearch: usersSearchSchema,
});

const usersAdminQueryKey = ['admin-users'];

function UsersComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { user: actor } = Route.useRouteContext();
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [banningUser, setBanningUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [unbanningUser, setUnbanningUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(
    null,
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: usersAdminQueryKey,
    search,
    defaults: defaultUsersSearch,
    navigate,
    queryFn: (nextSearch) => adminListUsers(toListUsersFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateUser,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '用户已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建用户失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      user,
    }: {
      userId: string;
      user: AdminUserEditFormValues;
    }) => adminUpdateUser(userId, user),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '用户信息已更新',
      });
      setEditingUser(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新用户失败'),
  });

  const banMutation = useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string;
      body: AdminUserBanFormValues;
    }) => adminBanUser(userId, body),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '用户已封禁',
      });
      setBanningUser(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '封禁用户失败'),
    onSettled: () => setPendingUserId(null),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminUnbanUser(userId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '用户已解封',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '解封用户失败'),
    onSettled: () => setPendingUserId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminDeleteUser(userId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '用户已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除用户失败'),
    onSettled: () => setPendingUserId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <UserFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新增用户
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载用户列表失败，请稍后重试。" />
      ) : null}

      <UserTableComponent
        items={items}
        actorId={actor.id}
        isLoading={isFetching}
        pendingUserId={pendingUserId}
        onEdit={setEditingUser}
        onBan={setBanningUser}
        onUnban={setUnbanningUser}
        onDelete={setDeletingUser}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null);
          }
        }}
        title="删除用户"
        description={
          deletingUser
            ? `确定删除用户「${deletingUser.name}」吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingUser) {
            return;
          }
          setPendingUserId(deletingUser.id);
          deleteMutation.mutate(deletingUser.id);
        }}
      />

      <ConfirmDialog
        open={unbanningUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnbanningUser(null);
          }
        }}
        title="解封用户"
        description={
          unbanningUser
            ? `确定解封用户「${unbanningUser.name}」吗？`
            : undefined
        }
        confirmLabel="解封"
        pending={unbanMutation.isPending}
        onConfirm={() => {
          if (!unbanningUser) {
            return;
          }
          setPendingUserId(unbanningUser.id);
          unbanMutation.mutate(unbanningUser.id);
        }}
      />

      <UserCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminUserCreateFormValues) =>
          createMutation.mutate(values)
        }
      />

      <UserEditDialogComponent
        user={editingUser}
        actorId={actor.id}
        open={editingUser !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingUser) {
            return;
          }
          updateMutation.mutate({
            userId: editingUser.id,
            user: values,
          });
        }}
      />

      <UserBanDialogComponent
        open={banningUser !== null}
        pending={banMutation.isPending}
        userName={banningUser?.name}
        onOpenChange={(open) => {
          if (!open) {
            setBanningUser(null);
          }
        }}
        onSubmit={(values) => {
          if (!banningUser) {
            return;
          }
          setPendingUserId(banningUser.id);
          banMutation.mutate({
            userId: banningUser.id,
            body: values,
          });
        }}
      />
    </section>
  );
}
