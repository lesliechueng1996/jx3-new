import { type Static, t } from 'elysia';

const dateOnlySchema = t.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  error: () => '日期格式须为 YYYY-MM-DD',
});

const nullableDateOnlySchema = t.Nullable(dateOnlySchema);

const descriptionSchema = t.Nullable(
  t.String({
    maxLength: 2000,
    error: () => '描述最多 2000 个字符',
  }),
);

const levelSchema = t.Integer({
  minimum: 1,
  maximum: 200,
  error: () => '等级须为 1-200',
});

export const gameExpansionIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const gameExpansionDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  level: t.Integer(),
  startDate: t.String(),
  endDate: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GameExpansionDetail = Static<typeof gameExpansionDetailSchema>;

export const listGameExpansionsResponseSchema = t.Object({
  items: t.Array(gameExpansionDetailSchema),
});

export type ListGameExpansionsResponse = Static<
  typeof listGameExpansionsResponseSchema
>;

export const createGameExpansionBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '名称长度须为1-64个字符',
  }),
  level: levelSchema,
  description: t.Optional(descriptionSchema),
  startDate: dateOnlySchema,
  endDate: t.Optional(nullableDateOnlySchema),
});

export type CreateGameExpansionBody = Static<
  typeof createGameExpansionBodySchema
>;

export const updateGameExpansionBodySchema = t.Object(
  {
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '名称长度须为1-64个字符',
      }),
    ),
    level: t.Optional(levelSchema),
    description: t.Optional(descriptionSchema),
    startDate: t.Optional(dateOnlySchema),
    endDate: t.Optional(nullableDateOnlySchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateGameExpansionBody = Static<
  typeof updateGameExpansionBodySchema
>;
