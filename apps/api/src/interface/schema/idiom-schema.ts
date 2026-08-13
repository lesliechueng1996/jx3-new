import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

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

export const singleIdiomParamsSchema = t.Object({
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

export const listIdiomsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    text: t.Optional(t.String()),
  }),
]);

export type ListIdiomsQuery = Static<typeof listIdiomsQuerySchema>;

export const listIdiomsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(
      t.Object({
        id: t.String(),
        text: t.String(),
        charCount: t.Integer(),
        pinyin: t.String(),
        tonePattern: t.String(),
        meaning: t.Nullable(t.String()),
        createdAt: t.String(),
        updatedAt: t.String(),
      }),
    ),
  }),
]);

export const updateIdiomBodySchema = t.Object(
  {
    text: t.Optional(
      t.String({
        minLength: 4,
        error: () => '成语长度至少为4个字符',
      }),
    ),
    pinyin: t.Optional(t.String()),
    tonePattern: t.Optional(t.String()),
    meaning: t.Optional(t.String()),
    chars: t.Optional(
      t.Array(
        t.Object({
          id: t.String({
            format: 'uuid',
            error: () => '字符ID格式不正确',
          }),
          position: t.Integer({
            minimum: 0,
            error: () => '位置不能小于0',
          }),
          char: t.String({
            minLength: 1,
            maxLength: 1,
            error: () => '字符长度必须为1',
          }),
          pinyin: t.String({
            minLength: 1,
            error: () => '拼音长度必须大于等于1',
          }),
          initial: t.String(),
          final: t.String({
            minLength: 1,
            error: () => '韵母长度必须大于等于1',
          }),
          tone: t.Integer({
            minimum: 0,
            maximum: 5,
            error: () => '声调必须在0-5之间',
          }),
        }),
        {
          minItems: 1,
          error: () => '字列表不能为空',
        },
      ),
    ),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateIdiomBody = Static<typeof updateIdiomBodySchema>;

export const updateIdiomResponseSchema = t.Object({
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

export const importIdiomsBodySchema = t.Object({
  file: t.File({
    maxSize: '10m',
    error: () => '文件大小不能超过10MB',
  }),
});

export const importIdiomsResponseSchema = t.Object({
  created: t.Integer(),
  skipped: t.Integer(),
  failed: t.Integer(),
  errors: t.Array(
    t.Object({
      row: t.Integer(),
      text: t.String(),
      message: t.String(),
    }),
  ),
});

export type ImportIdiomsResponse = Static<typeof importIdiomsResponseSchema>;

export const getPinyinQuerySchema = t.Object({
  text: t.String(),
});

export const getPinyinResponseSchema = t.Object({
  text: t.String(),
  inDatabase: t.Boolean(),
  idiomId: t.Nullable(t.String()),
  cells: t.Array(
    t.Object({
      position: t.Integer(),
      char: t.String(),
      pinyin: t.String(),
      initial: t.String(),
      final: t.String(),
      tone: t.Integer(),
    }),
  ),
});

const createIdiomColorSchema = (label: string) =>
  t.Enum(
    {
      black: 'black',
      orange: 'orange',
      green: 'green',
    },
    {
      error: () => `${label}颜色必须为black, orange, green`,
    },
  );

export const searchIdiomsBodySchema = t.Object({
  rounds: t.Array(
    t.Object({
      text: t.String({
        minLength: 4,
        maxLength: 4,
        error: () => '成语长度必须为4个字符',
      }),
      cells: t.Array(
        t.Object({
          position: t.Integer({
            minimum: 0,
            maximum: 3,
            error: () => '位置范围为0-3',
          }),
          char: t.String({
            minLength: 1,
            maxLength: 1,
            error: () => '单个字符长度必须为1',
          }),
          charColor: createIdiomColorSchema('字符'),
          initial: t.String(),
          initialColor: createIdiomColorSchema('声母'),
          final: t.String(),
          finalColor: createIdiomColorSchema('韵母'),
          tone: t.Integer({
            minimum: 0,
            maximum: 4,
            error: () => '声调范围为0-4',
          }),
          toneColor: createIdiomColorSchema('声调'),
          syllableLink: createIdiomColorSchema('拼音链接标志'),
        }),
        {
          minItems: 4,
          maxItems: 4,
          error: () => '格子数必须为4',
        },
      ),
    }),
    {
      minItems: 1,
      maxItems: 15,
      error: () => '回合数范围为1-15',
    },
  ),
  limit: t.Integer({
    minimum: 1,
    maximum: 50,
    default: 20,
    error: () => '限制范围为1-50',
  }),
});

export type SearchIdiomsRound = Static<
  typeof searchIdiomsBodySchema
>['rounds'][number];

export const searchIdiomsResponseSchema = t.Object({
  total: t.Integer(),
  items: t.Array(
    t.Object({
      id: t.String(),
      text: t.String(),
      pinyin: t.String(),
      meaning: t.Nullable(t.String()),
    }),
  ),
  analysis: t.Object({
    isUnique: t.Boolean(),
    byPosition: t.Array(
      t.Object({
        position: t.Integer(),
        charOptions: t.Array(t.String()),
        initialOptions: t.Array(t.String()),
        finalOptions: t.Array(t.String()),
        toneOptions: t.Array(t.Integer()),
      }),
    ),
    suggestedProbes: t.Array(
      t.Object({
        text: t.String(),
        reason: t.String(),
      }),
    ),
    message: t.Optional(t.String()),
  }),
});

export type SearchIdiomsResponse = Static<typeof searchIdiomsResponseSchema>;

export type SearchAnalysis = SearchIdiomsResponse['analysis'];
