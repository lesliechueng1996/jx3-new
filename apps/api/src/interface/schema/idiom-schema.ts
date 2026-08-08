import { type Static, t } from 'elysia';

export const createIdiomBodySchema = t.Object({
  text: t.String({
    minLength: 4,
    error: () => '成语长度至少为4个字符',
  }),
  meaning: t.Optional(t.String()),
});

export const createIdiomResponseSchema = t.Object({
  id: t.String(),
  text: t.String(),
  charCount: t.Integer(),
  pinyin: t.String(),
  tonePattern: t.String(),
  meaning: t.Nullable(t.String()),
  chars: t.Array(
    t.Object({
      id: t.String(),
      idiomId: t.String(),
      position: t.Integer(),
      char: t.String(),
      pinyin: t.String(),
      initial: t.String(),
      final: t.String(),
      tone: t.Integer(),
      createdAt: t.String(),
      updatedAt: t.String(),
    }),
  ),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type CreateIdiomResponse = Static<typeof createIdiomResponseSchema>;

export const getIdiomParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const getIdiomResponseSchema = t.Object({
  id: t.String(),
  text: t.String(),
  charCount: t.Integer(),
  pinyin: t.String(),
  tonePattern: t.String(),
  meaning: t.Nullable(t.String()),
  chars: t.Array(
    t.Object({
      id: t.String(),
      idiomId: t.String(),
      position: t.Integer(),
      char: t.String(),
      pinyin: t.String(),
      initial: t.String(),
      final: t.String(),
      tone: t.Integer(),
      createdAt: t.String(),
      updatedAt: t.String(),
    }),
  ),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GetIdiomResponse = Static<typeof getIdiomResponseSchema>;

export const deleteIdiomParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});
