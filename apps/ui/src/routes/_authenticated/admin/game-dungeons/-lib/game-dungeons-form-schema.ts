import { z } from 'zod';

export const dungeonFormDifficultySchema = z.enum([
  'normal',
  'heroic',
  'challenge',
]);

const integerStringSchema = (
  label: string,
  min: number,
  max: number,
): z.ZodType<string> =>
  z
    .string()
    .trim()
    .min(1, `请输入${label}`)
    .refine((value) => /^\d+$/.test(value), `${label}须为整数`)
    .refine((value) => {
      const parsed = Number(value);
      return parsed >= min && parsed <= max;
    }, `${label}须为 ${min}-${max}`);

export const gameDungeonFormSchema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
  expansionId: z.string().min(1, '请选择资料片'),
  seasonId: z.string().min(1, '请选择赛季'),
  playerLimit: integerStringSchema('人数', 1, 100),
  difficulty: dungeonFormDifficultySchema,
  levelRequirement: integerStringSchema('等级', 1, 200),
  bossCount: integerStringSchema('Boss 数量', 1, 50),
  resetWeekdays: z.array(z.number().int().min(1).max(7)),
});

export type GameDungeonFormValues = z.infer<typeof gameDungeonFormSchema>;
