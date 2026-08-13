import { asc, db, eq, idiomChar, inArray } from '@api/shared/util/db';

type IdiomChar = typeof idiomChar.$inferSelect;

export class IdiomCharRepository {
  async findByPhraseId(idiomId: string): Promise<IdiomChar[]> {
    const result = await db
      .select()
      .from(idiomChar)
      .where(eq(idiomChar.idiomId, idiomId))
      .orderBy(asc(idiomChar.position));

    return result;
  }

  async findByPhraseIds(phraseIds: string[]): Promise<IdiomChar[]> {
    const result = await db
      .select()
      .from(idiomChar)
      .where(inArray(idiomChar.idiomId, phraseIds))
      .orderBy(asc(idiomChar.position));

    return result;
  }
}
