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

const expansionIdSchema = t.String({
  format: 'uuid',
  error: () => '资料片ID格式不正确',
});

export const gameSeasonIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const listGameSeasonsQuerySchema = t.Object({
  expansionId: expansionIdSchema,
});

export type ListGameSeasonsQuery = Static<typeof listGameSeasonsQuerySchema>;

export const gameSeasonDetailSchema = t.Object({
  id: t.String(),
  expansionId: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  startDate: t.String(),
  endDate: t.Nullable(t.String()),
  sortOrder: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GameSeasonDetail = Static<typeof gameSeasonDetailSchema>;

export const listGameSeasonsResponseSchema = t.Object({
  items: t.Array(gameSeasonDetailSchema),
});

export type ListGameSeasonsResponse = Static<
  typeof listGameSeasonsResponseSchema
>;

export const createGameSeasonBodySchema = t.Object({
  expansionId: expansionIdSchema,
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '名称长度须为1-64个字符',
  }),
  description: t.Optional(descriptionSchema),
  startDate: dateOnlySchema,
  endDate: t.Optional(nullableDateOnlySchema),
  sortOrder: t.Optional(
    t.Integer({
      error: () => '排序须为整数',
    }),
  ),
});

export type CreateGameSeasonBody = Static<typeof createGameSeasonBodySchema>;

export const updateGameSeasonBodySchema = t.Object(
  {
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '名称长度须为1-64个字符',
      }),
    ),
    description: t.Optional(descriptionSchema),
    startDate: t.Optional(dateOnlySchema),
    endDate: t.Optional(nullableDateOnlySchema),
    sortOrder: t.Optional(
      t.Integer({
        error: () => '排序须为整数',
      }),
    ),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateGameSeasonBody = Static<typeof updateGameSeasonBodySchema>;
