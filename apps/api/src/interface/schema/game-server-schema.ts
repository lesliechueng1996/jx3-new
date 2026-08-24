import { type Static, t } from 'elysia';

const gameServerAliasSchema = t.Array(
  t.String({
    maxLength: 32,
    error: () => '别名最多 32 个字符',
  }),
  {
    maxItems: 20,
    error: () => '别名最多 20 个',
  },
);

export const gameServerIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const gameServerDetailSchema = t.Object({
  id: t.String(),
  serverId: t.String(),
  zone: t.String(),
  name: t.String(),
  alias: t.Array(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GameServerDetail = Static<typeof gameServerDetailSchema>;

export const gameServerPublicSchema = t.Object({
  id: t.String(),
  zone: t.String(),
  name: t.String(),
  alias: t.Array(t.String()),
});

export type GameServerPublic = Static<typeof gameServerPublicSchema>;

export const listAllGameServersResponseSchema = t.Array(gameServerPublicSchema);

export const listGameServersResponseSchema = t.Object({
  items: t.Array(gameServerDetailSchema),
});

export type ListGameServersResponse = Static<
  typeof listGameServersResponseSchema
>;

export const createGameServerBodySchema = t.Object({
  serverId: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '服务器 ID 长度须为1-64个字符',
  }),
  zone: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '大区长度须为1-64个字符',
  }),
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '名称长度须为1-64个字符',
  }),
  alias: t.Optional(gameServerAliasSchema),
});

export type CreateGameServerBody = Static<typeof createGameServerBodySchema>;

export const updateGameServerBodySchema = t.Object(
  {
    serverId: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '服务器 ID 长度须为1-64个字符',
      }),
    ),
    zone: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '大区长度须为1-64个字符',
      }),
    ),
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 64,
        error: () => '名称长度须为1-64个字符',
      }),
    ),
    alias: t.Optional(gameServerAliasSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateGameServerBody = Static<typeof updateGameServerBodySchema>;

export const syncGameServersResponseSchema = t.Object({
  updatedCount: t.Integer(),
  insertedCount: t.Integer(),
});

export type SyncGameServersResponse = Static<
  typeof syncGameServersResponseSchema
>;
