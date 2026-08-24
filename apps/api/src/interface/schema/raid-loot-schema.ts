import { type Static, t } from 'elysia';
import { itemQualitySchema, itemTypeSchema } from './game-item-schema';

const uuidSchema = (message: string) =>
  t.String({
    format: 'uuid',
    error: () => message,
  });

const remarkSchema = t.String({
  maxLength: 512,
  error: () => '备注最多 512 个字符',
});

export const raidLootIdParamsSchema = t.Object({
  id: uuidSchema('开团记录ID格式不正确'),
  lootId: uuidSchema('掉落记录ID格式不正确'),
});

export const upsertRaidLootBodySchema = t.Object({
  itemId: uuidSchema('物品ID格式不正确'),
  quantity: t.Integer({
    minimum: 1,
    error: () => '数量须为大于0的整数',
  }),
  winnerSignupId: t.Optional(t.Nullable(uuidSchema('获得者报名ID格式不正确'))),
  price: t.Optional(
    t.Nullable(
      t.Integer({
        minimum: 0,
        error: () => '成交价格不能为负数',
      }),
    ),
  ),
  remark: t.Optional(t.Nullable(remarkSchema)),
});

export type UpsertRaidLootBody = Static<typeof upsertRaidLootBodySchema>;

export const raidLootItemSchema = t.Object({
  id: t.String(),
  raidRunId: t.String(),
  itemId: t.String(),
  itemName: t.String(),
  itemIcon: t.Nullable(t.String()),
  itemType: itemTypeSchema,
  itemQuality: itemQualitySchema,
  quantity: t.Integer(),
  winnerSignupId: t.Nullable(t.String()),
  winnerCharacterName: t.Nullable(t.String()),
  winnerServerName: t.Nullable(t.String()),
  price: t.Nullable(t.Integer()),
  remark: t.Nullable(t.String()),
  createdAt: t.String(),
});

export type RaidLootItem = Static<typeof raidLootItemSchema>;

export const listRaidLootResponseSchema = t.Array(raidLootItemSchema);
