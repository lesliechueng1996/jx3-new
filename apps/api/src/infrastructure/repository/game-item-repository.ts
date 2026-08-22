import type { ListGameItemsQuery } from '@api/interface/schema/game-item-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  gameItem,
  ilike,
  or,
  raidLoot,
  type SQL,
  sql,
} from '@api/shared/util/db';

type GameItemInsert = typeof gameItem.$inferInsert;
type GameItemUpdate = Partial<
  Pick<
    GameItemInsert,
    | 'name'
    | 'gameItemId'
    | 'type'
    | 'quality'
    | 'description'
    | 'icon'
    | 'alias'
  >
>;

export class GameItemRepository {
  buildWhereClause(query: ListGameItemsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      const pattern = `%${query.name}%`;
      conditions.push(
        or(
          ilike(gameItem.name, pattern),
          sql`exists (select 1 from unnest(${gameItem.alias}) as alias_value where alias_value ilike ${pattern})`,
        ) as SQL,
      );
    }

    if (query.type) {
      conditions.push(eq(gameItem.type, query.type));
    }

    if (query.quality) {
      conditions.push(eq(gameItem.quality, query.quality));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(gameItem)
      .where(where)
      .orderBy(desc(gameItem.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(gameItem).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.name, name))
      .limit(1);
    return result[0] ?? null;
  }

  async findByGameItemId(gameItemId: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.gameItemId, gameItemId))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      GameItemInsert,
      | 'name'
      | 'gameItemId'
      | 'type'
      | 'quality'
      | 'description'
      | 'icon'
      | 'alias'
    >,
  ) {
    const [created] = await db.insert(gameItem).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameItemUpdate) {
    const [updated] = await db
      .update(gameItem)
      .set(values)
      .where(eq(gameItem.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameItem).where(eq(gameItem.id, id));
  }

  async isReferenced(id: string) {
    const [loot] = await db
      .select({ id: raidLoot.id })
      .from(raidLoot)
      .where(eq(raidLoot.itemId, id))
      .limit(1);

    return Boolean(loot);
  }
}

export const gameItemRepository = new GameItemRepository();
