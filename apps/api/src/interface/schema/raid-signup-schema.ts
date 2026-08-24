import { type Static, t } from 'elysia';
import { kungfuTypeSchema } from './kungfu-schema';

const nameSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '名称长度须为1-64个字符',
});

export const searchRaidSignupsQuerySchema = t.Object({
  name: nameSchema,
});

export type SearchRaidSignupsQuery = Static<
  typeof searchRaidSignupsQuerySchema
>;

export const raidSignupSearchItemSchema = t.Object({
  id: t.String(),
  characterName: t.String(),
  serverId: t.Nullable(t.String()),
  serverName: t.Nullable(t.String()),
  kungfuId: t.Nullable(t.String()),
  kungfuName: t.Nullable(t.String()),
  schoolId: t.Nullable(t.String()),
  kungfuType: t.Nullable(kungfuTypeSchema),
});

export type RaidSignupSearchItem = Static<typeof raidSignupSearchItemSchema>;

export const searchRaidSignupsResponseSchema = t.Array(
  raidSignupSearchItemSchema,
);
