import { asc, db, eq, gameItem, raidLoot } from '@api/shared/util/db';

type RaidLootInsert = typeof raidLoot.$inferInsert;

type RaidLootWrite = Pick<
  RaidLootInsert,
  | 'raidRunId'
  | 'itemId'
  | 'quantity'
  | 'winnerSignupId'
  | 'winnerCharacterName'
  | 'winnerServerName'
  | 'price'
  | 'remark'
  | 'createdBy'
>;

type RaidLootUpdate = Partial<
  Pick<
    RaidLootInsert,
    | 'itemId'
    | 'quantity'
    | 'winnerSignupId'
    | 'winnerCharacterName'
    | 'winnerServerName'
    | 'price'
    | 'remark'
  >
>;

const lootSelect = {
  id: raidLoot.id,
  raidRunId: raidLoot.raidRunId,
  itemId: raidLoot.itemId,
  quantity: raidLoot.quantity,
  winnerSignupId: raidLoot.winnerSignupId,
  winnerCharacterName: raidLoot.winnerCharacterName,
  winnerServerName: raidLoot.winnerServerName,
  price: raidLoot.price,
  remark: raidLoot.remark,
  createdAt: raidLoot.createdAt,
  itemName: gameItem.name,
  itemIcon: gameItem.icon,
  itemType: gameItem.type,
  itemQuality: gameItem.quality,
};

export class RaidLootRepository {
  listByRaidRunId(raidRunId: string) {
    return db
      .select(lootSelect)
      .from(raidLoot)
      .leftJoin(gameItem, eq(raidLoot.itemId, gameItem.id))
      .where(eq(raidLoot.raidRunId, raidRunId))
      .orderBy(asc(raidLoot.createdAt));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(raidLoot)
      .where(eq(raidLoot.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findDetailById(id: string) {
    const result = await db
      .select(lootSelect)
      .from(raidLoot)
      .leftJoin(gameItem, eq(raidLoot.itemId, gameItem.id))
      .where(eq(raidLoot.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(values: RaidLootWrite) {
    const [created] = await db.insert(raidLoot).values(values).returning();
    return created;
  }

  async updateById(id: string, values: RaidLootUpdate) {
    const [updated] = await db
      .update(raidLoot)
      .set(values)
      .where(eq(raidLoot.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(raidLoot).where(eq(raidLoot.id, id));
  }
}

export const raidLootRepository = new RaidLootRepository();
