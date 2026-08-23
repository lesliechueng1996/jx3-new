import type { CreateGameServerBody } from '@api/interface/schema/game-server-schema';
import {
  and,
  count,
  db,
  eq,
  gameCharacter,
  gameServer,
  inArray,
  playerBlocklist,
  raidSignup,
} from '@api/shared/util/db';

type GameServerInsert = typeof gameServer.$inferInsert;
type GameServerUpdate = Partial<
  Pick<typeof gameServer.$inferInsert, 'serverId' | 'zone' | 'name' | 'alias'>
>;

export type GameServerSyncUpdate = {
  id: string;
  serverId: string;
  zone: string;
  alias: string[];
};

export class GameServerRepository {
  listAll() {
    return db
      .select()
      .from(gameServer)
      .orderBy(gameServer.zone, gameServer.name);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameServer)
      .where(eq(gameServer.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByServerId(serverId: string) {
    const result = await db
      .select()
      .from(gameServer)
      .where(eq(gameServer.serverId, serverId))
      .limit(1);
    return result[0] ?? null;
  }

  async findByZoneAndName(zone: string, name: string) {
    const result = await db
      .select()
      .from(gameServer)
      .where(and(eq(gameServer.zone, zone), eq(gameServer.name, name)))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<GameServerInsert, 'serverId' | 'zone' | 'name' | 'alias'>,
  ) {
    const [created] = await db.insert(gameServer).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameServerUpdate) {
    const [updated] = await db
      .update(gameServer)
      .set(values)
      .where(eq(gameServer.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameServer).where(eq(gameServer.id, id));
  }

  async isReferenced(id: string) {
    const [character, signup, blocklist] = await Promise.all([
      db
        .select({ id: gameCharacter.id })
        .from(gameCharacter)
        .where(eq(gameCharacter.serverId, id))
        .limit(1),
      db
        .select({ id: raidSignup.id })
        .from(raidSignup)
        .where(eq(raidSignup.serverId, id))
        .limit(1),
      db
        .select({ id: playerBlocklist.id })
        .from(playerBlocklist)
        .where(eq(playerBlocklist.serverId, id))
        .limit(1),
    ]);

    return Boolean(character[0] || signup[0] || blocklist[0]);
  }

  async updateBatch(
    toUpdate: GameServerSyncUpdate[],
    toInsert: CreateGameServerBody[],
  ) {
    return await db.transaction(async (tx) => {
      for (const item of toUpdate) {
        await tx
          .update(gameServer)
          .set({
            serverId: item.serverId,
            zone: item.zone,
            alias: item.alias,
          })
          .where(eq(gameServer.id, item.id));
      }

      if (toInsert.length > 0) {
        await tx.insert(gameServer).values(
          toInsert.map((item) => ({
            serverId: item.serverId,
            zone: item.zone,
            name: item.name,
            alias: item.alias,
          })),
        );
      }
    });
  }

  async countByIds(ids: string[]) {
    const result = await db
      .select({ total: count() })
      .from(gameServer)
      .where(inArray(gameServer.id, ids));
    return result[0]?.total ?? 0;
  }
}

export const gameServerRepository = new GameServerRepository();
