import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

export const schoolTypeSchema = t.Enum(
  {
    school: 'school',
    genre: 'genre',
  },
  {
    error: () => '门派类型不正确',
  },
);

export type SchoolType = Static<typeof schoolTypeSchema>;

const schoolAliasSchema = t.Array(
  t.String({
    maxLength: 32,
    error: () => '别名最多 32 个字符',
  }),
  {
    maxItems: 20,
    error: () => '别名最多 20 个',
  },
);

export const schoolIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const schoolDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  type: schoolTypeSchema,
  icon: t.Nullable(t.String()),
  alias: t.Array(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type SchoolDetail = Static<typeof schoolDetailSchema>;

export const listSchoolsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    type: t.Optional(schoolTypeSchema),
  }),
]);

export type ListSchoolsQuery = Static<typeof listSchoolsQuerySchema>;

export const listSchoolsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(schoolDetailSchema),
  }),
]);

export const createSchoolBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '名称长度须为1-64个字符',
  }),
  type: schoolTypeSchema,
  icon: t.Optional(t.Nullable(t.String())),
  alias: t.Optional(schoolAliasSchema),
});

export type CreateSchoolBody = Static<typeof createSchoolBodySchema>;

export const updateSchoolBodySchema = t.Object(
  {
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '名称长度须为1-64个字符',
      }),
    ),
    type: t.Optional(schoolTypeSchema),
    icon: t.Optional(t.Nullable(t.String())),
    alias: t.Optional(schoolAliasSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateSchoolBody = Static<typeof updateSchoolBodySchema>;
