import { z } from 'zod';

export const authCredentialsSchema = z.object({
  email: z.string().min(1, '请输入用户名').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(8, '密码至少 8 位'),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
