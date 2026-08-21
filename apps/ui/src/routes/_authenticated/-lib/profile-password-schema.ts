import { z } from 'zod';

export const profilePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(8, '密码至少 8 位'),
    confirmPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  });

export type ProfilePasswordFormValues = z.infer<
  typeof profilePasswordFormSchema
>;
