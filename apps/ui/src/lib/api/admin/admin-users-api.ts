import { apiClient } from '@/lib/api-client';

export type ListUsersFilters = {
  page: number;
  pageSize: number;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  banned?: boolean;
};

export const adminListUsers = async (filters: ListUsersFilters) => {
  const { data, error } = await apiClient.api.v1.user.get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      email: filters.email,
      role: filters.role,
      banned: filters.banned,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取用户列表失败');
  }

  return data.data;
};

export type AdminUserListItem = Awaited<
  ReturnType<typeof adminListUsers>
>['items'][number];

export type AdminUserCreateFormValues = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
};

export const adminCreateUser = async (user: AdminUserCreateFormValues) => {
  const { data, error } = await apiClient.api.v1.user.post({
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建用户失败');
  }

  return data.data;
};

export type AdminUserEditFormValues = {
  name: string;
  email?: string;
  password?: string;
  role: 'admin' | 'user';
};

export const adminUpdateUser = async (
  userId: string,
  user: AdminUserEditFormValues,
) => {
  const { data, error } = await apiClient.api.v1
    .user({
      id: userId,
    })
    .patch({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    });

  if (error) {
    throw new Error(error.value.message ?? '更新用户失败');
  }

  return data.data;
};

export const adminDeleteUser = async (userId: string) => {
  const { error } = await apiClient.api.v1
    .user({
      id: userId,
    })
    .delete();

  if (error) {
    throw new Error(error.value.message ?? '删除用户失败');
  }
};

export type AdminUserBanFormValues = {
  reason: string;
  banExpiresIn?: number;
};

export const adminBanUser = async (
  userId: string,
  body: AdminUserBanFormValues,
) => {
  const { data, error } = await apiClient.api.v1
    .user({
      id: userId,
    })
    .ban.post({
      reason: body.reason,
      banExpiresIn: body.banExpiresIn,
    });

  if (error) {
    throw new Error(error.value.message ?? '封禁用户失败');
  }

  return data.data;
};

export const adminUnbanUser = async (userId: string) => {
  const { data, error } = await apiClient.api.v1
    .user({
      id: userId,
    })
    .unban.post();

  if (error) {
    throw new Error(error.value.message ?? '解封用户失败');
  }

  return data.data;
};
