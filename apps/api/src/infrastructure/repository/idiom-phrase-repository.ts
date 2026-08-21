import type { Idiom } from '@api/domain/model/idiom/idiom';
import {
  ERROR_CODES,
  InternalServerErrorException,
  NotFoundException,
} from '@api/shared/exception';
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  idiomChar,
  idiomPhrase,
  ilike,
  type SQL,
} from '@api/shared/util/db';

type IdiomPhrase = typeof idiomPhrase.$inferSelect;
type IdiomChar = typeof idiomChar.$inferSelect;
type IdiomCharUpdate = Pick<
  IdiomChar,
  'id' | 'position' | 'char' | 'pinyin' | 'initial' | 'final' | 'tone'
>;

export class IdiomPhraseRepository {
  async create(
    idiom: Idiom,
  ): Promise<{ idiom: IdiomPhrase; chars: IdiomChar[] }> {
    if (!idiom.isValid()) {
      throw new InternalServerErrorException(
        'Parse pinyin failed',
        ERROR_CODES.IDIOM_PARSE_PINYIN_FAILED,
      );
    }

    const result = await db.transaction(async (tx) => {
      const [phrase] = await tx
        .insert(idiomPhrase)
        .values({
          text: idiom.text,
          charCount: idiom.chars.length,
          pinyin: idiom.pinyin,
          tonePattern: idiom.tonePattern,
          meaning: idiom.meaning,
        })
        .returning();

      const chars = await tx
        .insert(idiomChar)
        .values(
          idiom.chars.map((char) => ({
            idiomId: phrase.id,
            char: char.char,
            position: char.position,
            pinyin: char.pinyin,
            initial: char.initial,
            final: char.final,
            tone: char.tone,
          })),
        )
        .returning();

      return {
        idiom: phrase,
        chars,
      };
    });

    return result;
  }

  async findByText(text: string): Promise<IdiomPhrase | null> {
    const result = await db
      .select()
      .from(idiomPhrase)
      .where(eq(idiomPhrase.text, text))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async findById(id: string): Promise<IdiomPhrase | null> {
    const result = await db
      .select()
      .from(idiomPhrase)
      .where(eq(idiomPhrase.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async deleteById(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(idiomPhrase).where(eq(idiomPhrase.id, id));
      await tx.delete(idiomChar).where(eq(idiomChar.idiomId, id));
    });
  }

  #buildListIdiomWhere(text: string) {
    if (!text) {
      return undefined;
    }

    return ilike(idiomPhrase.text, `%${text}%`);
  }

  async listPagination(text: string, limit: number, offset: number) {
    const where = this.#buildListIdiomWhere(text);

    const items = await db
      .select()
      .from(idiomPhrase)
      .where(where)
      .orderBy(desc(idiomPhrase.createdAt))
      .limit(limit)
      .offset(offset);

    return items;
  }

  async count(text: string) {
    const where = this.#buildListIdiomWhere(text);

    const [result] = await db
      .select({ total: count() })
      .from(idiomPhrase)
      .where(where);

    return result?.total ?? 0;
  }

  async updateById(
    id: string,
    properties: Partial<IdiomPhrase>,
    chars: IdiomCharUpdate[],
  ) {
    const result = await db.transaction(async (tx) => {
      const [updatedIdiom] = await tx
        .update(idiomPhrase)
        .set(properties)
        .where(eq(idiomPhrase.id, id))
        .returning();

      if (!updatedIdiom) {
        return null;
      }

      if (chars.length > 0) {
        // Move positions to temporary negative slots first to avoid unique
        // conflicts when swapping idiom_char positions in-place.
        for (const [index, char] of chars.entries()) {
          const [moved] = await tx
            .update(idiomChar)
            .set({ position: -1 - index })
            .where(and(eq(idiomChar.id, char.id), eq(idiomChar.idiomId, id)))
            .returning({ id: idiomChar.id });

          if (!moved) {
            throw new NotFoundException(
              '字记录不存在或不属于该成语',
              ERROR_CODES.IDIOM_NOT_FOUND,
            );
          }
        }

        for (const char of chars) {
          await tx
            .update(idiomChar)
            .set({
              position: char.position,
              char: char.char,
              pinyin: char.pinyin,
              initial: char.initial,
              final: char.final,
              tone: char.tone,
            })
            .where(and(eq(idiomChar.id, char.id), eq(idiomChar.idiomId, id)));
        }
      }

      const updatedChars = await tx
        .select()
        .from(idiomChar)
        .where(eq(idiomChar.idiomId, id))
        .orderBy(asc(idiomChar.position));

      return {
        idiom: updatedIdiom,
        chars: updatedChars,
      };
    });

    return result;
  }

  async insertProcessedIdiom(processed: Idiom) {
    return await db.transaction(async (tx) => {
      const phraseRows = await tx
        .insert(idiomPhrase)
        .values({
          text: processed.text,
          charCount: processed.chars.length,
          pinyin: processed.pinyin,
          tonePattern: processed.tonePattern,
          meaning: processed.meaning,
        })
        .returning();

      const phrase = phraseRows[0];
      if (!phrase) {
        throw new Error('Failed to create idiom');
      }

      const charRows = await tx
        .insert(idiomChar)
        .values(
          processed.chars.map((item) => ({
            idiomId: phrase.id,
            position: item.position,
            char: item.char,
            pinyin: item.pinyin,
            initial: item.initial,
            final: item.final,
            tone: item.tone,
          })),
        )
        .returning();

      return {
        idiom: phrase,
        chars: charRows,
      };
    });
  }

  async search(where: SQL | undefined) {
    const items = await db
      .select()
      .from(idiomPhrase)
      .where(where)
      .orderBy(desc(idiomPhrase.createdAt));

    return items;
  }
}

export const idiomPhraseRepository = new IdiomPhraseRepository();
