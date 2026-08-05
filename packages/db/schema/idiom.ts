import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const idiomPhrase = pgTable(
  'idiom_phrase',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    text: t.text('text').notNull(),
    charCount: t.smallint('char_count').notNull(),
    pinyin: t.text('pinyin').notNull(),
    tonePattern: t.text('tone_pattern').notNull(),
    meaning: t.text('meaning'),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    t.unique('idiom_phrase_text_unique').on(table.text),
    t.index('idiom_phrase_tone_pattern_idx').on(table.tonePattern),
    t.index('idiom_phrase_char_count_idx').on(table.charCount),
  ],
);

export const idiomChar = pgTable(
  'idiom_char',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    idiomId: t.uuid('idiom_id').notNull(),
    position: t.smallint('position').notNull(),
    char: t.text('char').notNull(),
    pinyin: t.text('pinyin').notNull(),
    initial: t.text('initial').notNull(),
    final: t.text('final').notNull(),
    tone: t.smallint('tone').notNull(),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    t
      .unique('idiom_char_idiom_position_unique')
      .on(table.idiomId, table.position),
    t.index('idiom_char_idiom_id_idx').on(table.idiomId),
    t
      .index('idiom_char_position_final_tone_idx')
      .on(table.position, table.final, table.tone),
    t
      .index('idiom_char_initial_final_tone_idx')
      .on(table.initial, table.final, table.tone),
  ],
);
