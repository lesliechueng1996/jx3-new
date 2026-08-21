import { apiClient } from '@/lib/api-client';

export const uploadAvatar = async (file: File) => {
  const { data, error } = await apiClient.api.v1.user.avatar.post({
    file,
  });

  if (error) {
    throw new Error(error.value.message ?? '上传头像失败');
  }

  return data.data;
};

export const changePassword = async (body: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data, error } = await apiClient.api.v1.user.password.post(body);

  if (error) {
    throw new Error(error.value.message ?? '修改密码失败');
  }

  return data.data;
};
