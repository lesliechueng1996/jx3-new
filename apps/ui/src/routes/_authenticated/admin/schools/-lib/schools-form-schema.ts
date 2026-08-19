import { z } from 'zod';

export const schoolFormTypeSchema = z.enum(['school', 'genre']);

export const schoolFormSchema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
  type: schoolFormTypeSchema,
  icon: z.string().trim().max(512, '图标地址最多 512 个字符'),
  aliasText: z.string().max(200, '别名最多 200 个字符'),
});

export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
