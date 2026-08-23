import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

export const kungfuTypeSchema = t.Enum(
  {
    defense: 'defense',
    heal: 'heal',
    attack: 'attack',
  },
  {
    error: () => '心法类型不正确',
  },
);

export type KungfuType = Static<typeof kungfuTypeSchema>;

export const attackTypeSchema = t.Enum(
  {
    internal: 'internal',
    external: 'external',
  },
  {
    error: () => '攻击类型不正确',
  },
);

export type AttackType = Static<typeof attackTypeSchema>;

export const attackMethodSchema = t.Enum(
  {
    melee: 'melee',
    ranged: 'ranged',
  },
  {
    error: () => '攻击方式不正确',
  },
);

export type AttackMethod = Static<typeof attackMethodSchema>;

const kungfuAliasSchema = t.Array(
  t.String({
    maxLength: 32,
    error: () => '别名最多 32 个字符',
  }),
  {
    maxItems: 20,
    error: () => '别名最多 20 个',
  },
);

export const kungfuIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

const schoolIdSchema = t.String({
  format: 'uuid',
  error: () => '门派ID格式不正确',
});

export const kungfuDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  schoolId: t.String(),
  schoolName: t.String(),
  kungfuType: kungfuTypeSchema,
  attackType: t.Nullable(attackTypeSchema),
  attackMethod: t.Nullable(attackMethodSchema),
  formationName: t.Nullable(t.String()),
  formationEffect: t.Nullable(t.String()),
  isPveExternalRecommended: t.Boolean(),
  isPveInternalRecommended: t.Boolean(),
  isUnlimited: t.Boolean(),
  icon: t.Nullable(t.String()),
  alias: t.Array(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type KungfuDetail = Static<typeof kungfuDetailSchema>;

export const kungfuPublicSchema = t.Object({
  id: t.String(),
  name: t.String(),
  schoolId: t.String(),
  schoolName: t.String(),
  kungfuType: kungfuTypeSchema,
  icon: t.Nullable(t.String()),
  alias: t.Array(t.String()),
});

export type KungfuPublic = Static<typeof kungfuPublicSchema>;

export const listAllKungfusResponseSchema = t.Array(kungfuPublicSchema);

export const listKungfusQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    schoolId: t.Optional(schoolIdSchema),
    kungfuType: t.Optional(kungfuTypeSchema),
    attackType: t.Optional(attackTypeSchema),
    attackMethod: t.Optional(attackMethodSchema),
    isUnlimited: t.Optional(t.Boolean()),
  }),
]);

export type ListKungfusQuery = Static<typeof listKungfusQuerySchema>;

export const listKungfusResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(kungfuDetailSchema),
  }),
]);

export const createKungfuBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '名称长度须为1-64个字符',
  }),
  schoolId: schoolIdSchema,
  kungfuType: kungfuTypeSchema,
  attackType: t.Optional(t.Nullable(attackTypeSchema)),
  attackMethod: t.Optional(t.Nullable(attackMethodSchema)),
  formationName: t.Optional(
    t.Nullable(
      t.String({
        maxLength: 64,
        error: () => '阵眼名称最多 64 个字符',
      }),
    ),
  ),
  formationEffect: t.Optional(
    t.Nullable(
      t.String({
        maxLength: 2000,
        error: () => '阵眼效果最多 2000 个字符',
      }),
    ),
  ),
  isPveExternalRecommended: t.Optional(t.Boolean()),
  isPveInternalRecommended: t.Optional(t.Boolean()),
  isUnlimited: t.Optional(t.Boolean()),
  icon: t.Optional(t.Nullable(t.String())),
  alias: t.Optional(kungfuAliasSchema),
});

export type CreateKungfuBody = Static<typeof createKungfuBodySchema>;

export const updateKungfuBodySchema = t.Object(
  {
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '名称长度须为1-64个字符',
      }),
    ),
    schoolId: t.Optional(schoolIdSchema),
    kungfuType: t.Optional(kungfuTypeSchema),
    attackType: t.Optional(t.Nullable(attackTypeSchema)),
    attackMethod: t.Optional(t.Nullable(attackMethodSchema)),
    formationName: t.Optional(
      t.Nullable(
        t.String({
          maxLength: 64,
          error: () => '阵眼名称最多 64 个字符',
        }),
      ),
    ),
    formationEffect: t.Optional(
      t.Nullable(
        t.String({
          maxLength: 2000,
          error: () => '阵眼效果最多 2000 个字符',
        }),
      ),
    ),
    isPveExternalRecommended: t.Optional(t.Boolean()),
    isPveInternalRecommended: t.Optional(t.Boolean()),
    isUnlimited: t.Optional(t.Boolean()),
    icon: t.Optional(t.Nullable(t.String())),
    alias: t.Optional(kungfuAliasSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateKungfuBody = Static<typeof updateKungfuBodySchema>;
