import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

export const dungeonDifficultySchema = t.Enum(
  {
    normal: 'normal',
    heroic: 'heroic',
    challenge: 'challenge',
  },
  {
    error: () => '副本难度不正确',
  },
);

export type DungeonDifficulty = Static<typeof dungeonDifficultySchema>;

const uuidSchema = (message: string) =>
  t.String({
    format: 'uuid',
    error: () => message,
  });

const nameSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '名称长度须为1-64个字符',
});

const playerLimitSchema = t.Integer({
  minimum: 1,
  maximum: 100,
  error: () => '人数须为 1-100',
});

const levelRequirementSchema = t.Integer({
  minimum: 1,
  maximum: 200,
  error: () => '等级须为 1-200',
});

const bossCountSchema = t.Integer({
  minimum: 1,
  maximum: 50,
  error: () => 'Boss 数量须为 1-50',
});

const resetWeekdaysSchema = t.Array(
  t.Integer({
    minimum: 1,
    maximum: 7,
    error: () => '刷新日须为 1-7',
  }),
  {
    maxItems: 7,
    uniqueItems: true,
    error: () => '刷新日最多 7 个且不能重复',
  },
);

export const gameDungeonIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const gameDungeonDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  expansionId: t.String(),
  expansionName: t.String(),
  seasonId: t.String(),
  seasonName: t.String(),
  playerLimit: t.Integer(),
  difficulty: dungeonDifficultySchema,
  levelRequirement: t.Integer(),
  bossCount: t.Integer(),
  resetWeekdays: t.Array(t.Integer()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GameDungeonDetail = Static<typeof gameDungeonDetailSchema>;

export const listGameDungeonsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    expansionId: t.Optional(uuidSchema('资料片ID格式不正确')),
    seasonId: t.Optional(uuidSchema('赛季ID格式不正确')),
    difficulty: t.Optional(dungeonDifficultySchema),
  }),
]);

export type ListGameDungeonsQuery = Static<typeof listGameDungeonsQuerySchema>;

export const listGameDungeonsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(gameDungeonDetailSchema),
  }),
]);

export const createGameDungeonBodySchema = t.Object({
  name: nameSchema,
  expansionId: uuidSchema('资料片ID格式不正确'),
  seasonId: uuidSchema('赛季ID格式不正确'),
  playerLimit: playerLimitSchema,
  difficulty: dungeonDifficultySchema,
  levelRequirement: levelRequirementSchema,
  bossCount: bossCountSchema,
  resetWeekdays: t.Optional(resetWeekdaysSchema),
});

export type CreateGameDungeonBody = Static<typeof createGameDungeonBodySchema>;

export const updateGameDungeonBodySchema = t.Object(
  {
    name: t.Optional(nameSchema),
    expansionId: t.Optional(uuidSchema('资料片ID格式不正确')),
    seasonId: t.Optional(uuidSchema('赛季ID格式不正确')),
    playerLimit: t.Optional(playerLimitSchema),
    difficulty: t.Optional(dungeonDifficultySchema),
    levelRequirement: t.Optional(levelRequirementSchema),
    bossCount: t.Optional(bossCountSchema),
    resetWeekdays: t.Optional(resetWeekdaysSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateGameDungeonBody = Static<typeof updateGameDungeonBodySchema>;
