import { z } from 'zod';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';

export const userFormRoleSchema = z.enum([ROLE_USER, ROLE_ADMIN]);

export const createUserFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请输入用户名')
    .max(64, '用户名最多 64 个字符'),
  email: z.email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少 8 位'),
  role: userFormRoleSchema,
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请输入用户名')
    .max(64, '用户名最多 64 个字符'),
  email: z
    .union([z.literal(''), z.email('请输入有效的邮箱地址')])
    .transform((value) => (value === '' ? undefined : value)),
  password: z
    .union([z.literal(''), z.string().min(8, '密码至少 8 位')])
    .transform((value) => (value === '' ? undefined : value)),
  role: userFormRoleSchema,
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export const BAN_DURATION_VALUES = ['permanent', '1d', '7d', '30d'] as const;

export type BanDuration = (typeof BAN_DURATION_VALUES)[number];

export const banUserFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, '请填写封禁原因')
    .max(200, '封禁原因最多 200 个字符'),
  duration: z.enum(BAN_DURATION_VALUES),
});

export type BanUserFormValues = z.infer<typeof banUserFormSchema>;

export const banDurationToSeconds = (
  duration: BanDuration,
): number | undefined => {
  if (duration === 'permanent') {
    return undefined;
  }
  if (duration === '1d') {
    return 60 * 60 * 24;
  }
  if (duration === '7d') {
    return 60 * 60 * 24 * 7;
  }
  return 60 * 60 * 24 * 30;
};
