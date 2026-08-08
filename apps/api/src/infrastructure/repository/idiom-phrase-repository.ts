import type { Idiom } from '@/domain/idiom/idiom';
import { ERROR_CODES, InternalServerErrorException } from '@/shared/exception';
import {
  count,
  db,
  desc,
  eq,
  idiomChar,
  idiomPhrase,
  ilike,
} from '@/shared/util/db';

type IdiomPhrase = typeof idiomPhrase.$inferSelect;
type IdiomChar = typeof idiomChar.$inferSelect;

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
}
