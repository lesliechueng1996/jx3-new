import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';
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

export const raidSignupRoleSchema = t.Enum(
  {
    pending: 'pending',
    tank: 'tank',
    healer: 'healer',
    dps: 'dps',
    boss: 'boss',
  },
  {
    error: () => '位置类型不正确',
  },
);

export type RaidSignupRole = Static<typeof raidSignupRoleSchema>;

export const raidSignupStatusSchema = t.Enum(
  {
    pending: 'pending',
    confirmed: 'confirmed',
    waitlist: 'waitlist',
    rejected: 'rejected',
  },
  {
    error: () => '报名状态不正确',
  },
);

export type RaidSignupStatus = Static<typeof raidSignupStatusSchema>;

export const raidSignupFlagSchema = t.Union([
  t.Literal('leader'),
  t.Literal('darkRun'),
  t.Literal('formationCore'),
  t.Literal('reserved'),
]);

export type RaidSignupFlag = Static<typeof raidSignupFlagSchema>;

export const listRaidSignupsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    characterName: t.Optional(t.String()),
    raidRunName: t.Optional(t.String()),
    serverId: t.Optional(
      t.String({
        format: 'uuid',
        error: () => '服务器ID格式不正确',
      }),
    ),
    kungfuId: t.Optional(
      t.String({
        format: 'uuid',
        error: () => '心法ID格式不正确',
      }),
    ),
    role: t.Optional(raidSignupRoleSchema),
    flags: t.Optional(
      t.Union([raidSignupFlagSchema, t.Array(raidSignupFlagSchema)]),
    ),
  }),
]);

export type ListRaidSignupsQuery = Static<typeof listRaidSignupsQuerySchema>;

const nullableString = t.Nullable(t.String());

export const raidSignupListItemSchema = t.Object({
  id: t.String(),
  raidRunId: t.String(),
  raidRunName: nullableString,
  startTime: nullableString,
  dungeonName: nullableString,
  role: raidSignupRoleSchema,
  status: raidSignupStatusSchema,
  isReserved: t.Boolean(),
  isLeader: t.Boolean(),
  isDarkRun: t.Boolean(),
  isFormationCore: t.Boolean(),
  characterName: t.String(),
  serverName: nullableString,
  kungfuName: nullableString,
  createdAt: t.String(),
});

export type RaidSignupListItem = Static<typeof raidSignupListItemSchema>;

export const listRaidSignupsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(raidSignupListItemSchema),
  }),
]);
