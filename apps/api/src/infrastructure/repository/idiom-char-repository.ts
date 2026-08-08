import { asc, db, eq, idiomChar } from '@/shared/util/db';

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
}
