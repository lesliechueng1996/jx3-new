import { z } from 'zod';

export const gameServerFormSchema = z.object({
  serverId: z
    .string()
    .trim()
    .min(1, '请输入服务器 ID')
    .max(64, '服务器 ID 最多 64 个字符'),
  zone: z.string().trim().min(1, '请输入大区').max(64, '大区最多 64 个字符'),
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
  aliasText: z.string().max(200, '别名最多 200 个字符'),
});

export type GameServerFormValues = z.infer<typeof gameServerFormSchema>;
