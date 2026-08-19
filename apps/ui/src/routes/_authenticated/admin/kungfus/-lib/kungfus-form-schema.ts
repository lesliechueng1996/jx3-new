import { z } from 'zod';

export const kungfuFormTypeSchema = z.enum(['defense', 'heal', 'attack']);
export const kungfuFormAttackTypeSchema = z.enum(['internal', 'external', '']);
export const kungfuFormAttackMethodSchema = z.enum(['melee', 'ranged', '']);

export const FORMATION_EFFECT_LEVEL_LABELS = [
  '第一重',
  '第二重',
  '第三重',
  '第四重',
  '第五重',
  '第六重',
] as const;

export type FormationEffectLevels = [
  string,
  string,
  string,
  string,
  string,
  string,
];

export const emptyFormationEffects = (): FormationEffectLevels => [
  '',
  '',
  '',
  '',
  '',
  '',
];

export const splitFormationEffect = (value: string): FormationEffectLevels => {
  const parts = value.replaceAll('\r\n', '\n').split('\n');
  return [
    parts[0] ?? '',
    parts[1] ?? '',
    parts[2] ?? '',
    parts[3] ?? '',
    parts[4] ?? '',
    parts[5] ?? '',
  ];
};

export const joinFormationEffect = (levels: readonly string[]): string => {
  const normalized = emptyFormationEffects().map((_, index) =>
    (levels[index] ?? '').trim(),
  );
  while (normalized.length > 0 && normalized[normalized.length - 1] === '') {
    normalized.pop();
  }
  return normalized.join('\n');
};

export const kungfuFormSchema = z
  .object({
    name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
    schoolId: z.string().min(1, '请选择门派'),
    kungfuType: kungfuFormTypeSchema,
    attackType: kungfuFormAttackTypeSchema,
    attackMethod: kungfuFormAttackMethodSchema,
    formationName: z.string().trim().max(64, '阵眼名称最多 64 个字符'),
    formationEffects: z.tuple([
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
    ]),
    isPveExternalRecommended: z.boolean(),
    isPveInternalRecommended: z.boolean(),
    isUnlimited: z.boolean(),
    icon: z.string().trim().max(512, '图标地址最多 512 个字符'),
    aliasText: z.string().max(200, '别名最多 200 个字符'),
  })
  .superRefine((values, ctx) => {
    if (joinFormationEffect(values.formationEffects).length > 2000) {
      ctx.addIssue({
        code: 'custom',
        message: '阵眼效果最多 2000 个字符',
        path: ['formationEffects'],
      });
    }
  });

export type KungfuFormValues = z.infer<typeof kungfuFormSchema>;
