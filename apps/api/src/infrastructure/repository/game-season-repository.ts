import { and, db, eq, gameDungeon, gameSeason } from '@api/shared/util/db';

type GameSeasonInsert = typeof gameSeason.$inferInsert;
type GameSeasonUpdate = Partial<
  Pick<
    GameSeasonInsert,
    'name' | 'description' | 'startDate' | 'endDate' | 'sortOrder'
  >
>;

export class GameSeasonRepository {
  listByExpansionId(expansionId: string) {
    return db
      .select()
      .from(gameSeason)
      .where(eq(gameSeason.expansionId, expansionId))
      .orderBy(gameSeason.sortOrder, gameSeason.startDate, gameSeason.name);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameSeason)
      .where(eq(gameSeason.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByExpansionIdAndName(expansionId: string, name: string) {
    const result = await db
      .select()
      .from(gameSeason)
      .where(
        and(eq(gameSeason.expansionId, expansionId), eq(gameSeason.name, name)),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async existsByExpansionId(expansionId: string) {
    const result = await db
      .select({ id: gameSeason.id })
      .from(gameSeason)
      .where(eq(gameSeason.expansionId, expansionId))
      .limit(1);
    return Boolean(result[0]);
  }

  async create(
    values: Pick<
      GameSeasonInsert,
      | 'expansionId'
      | 'name'
      | 'description'
      | 'startDate'
      | 'endDate'
      | 'sortOrder'
    >,
  ) {
    const [created] = await db.insert(gameSeason).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameSeasonUpdate) {
    const [updated] = await db
      .update(gameSeason)
      .set(values)
      .where(eq(gameSeason.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameSeason).where(eq(gameSeason.id, id));
  }

  async isReferenced(id: string) {
    const [dungeon] = await db
      .select({ id: gameDungeon.id })
      .from(gameDungeon)
      .where(eq(gameDungeon.seasonId, id))
      .limit(1);

    return Boolean(dungeon);
  }
}

export const gameSeasonRepository = new GameSeasonRepository();
