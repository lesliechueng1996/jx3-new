import { t } from 'elysia';
import { createSuccessResponseSchema } from './common';

export const createIdiomBodySchema = t.Object({
  text: t.String({
    minLength: 4,
  }),
  meaning: t.Optional(t.String()),
});

export const createIdiomResponseSchema = createSuccessResponseSchema(
  t.Object({
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
  }),
);
