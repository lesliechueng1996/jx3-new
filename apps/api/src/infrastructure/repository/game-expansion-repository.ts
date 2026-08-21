import { db, desc, eq, gameDungeon, gameExpansion } from '@api/shared/util/db';

type GameExpansionInsert = typeof gameExpansion.$inferInsert;
type GameExpansionUpdate = Partial<
  Pick<
    GameExpansionInsert,
    'name' | 'description' | 'level' | 'startDate' | 'endDate'
  >
>;

export class GameExpansionRepository {
  listAll() {
    return db
      .select()
      .from(gameExpansion)
      .orderBy(desc(gameExpansion.startDate), gameExpansion.name);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameExpansion)
      .where(eq(gameExpansion.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(gameExpansion)
      .where(eq(gameExpansion.name, name))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      GameExpansionInsert,
      'name' | 'description' | 'level' | 'startDate' | 'endDate'
    >,
  ) {
    const [created] = await db.insert(gameExpansion).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameExpansionUpdate) {
    const [updated] = await db
      .update(gameExpansion)
      .set(values)
      .where(eq(gameExpansion.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameExpansion).where(eq(gameExpansion.id, id));
  }

  async isReferenced(id: string) {
    const [dungeon] = await db
      .select({ id: gameDungeon.id })
      .from(gameDungeon)
      .where(eq(gameDungeon.expansionId, id))
      .limit(1);

    return Boolean(dungeon);
  }
}

export const gameExpansionRepository = new GameExpansionRepository();
