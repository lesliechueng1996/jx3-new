import type { ListRaidSignupsQuery } from '@api/interface/schema/raid-signup-schema';
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  gameDungeon,
  gameKungfu,
  gameServer,
  ilike,
  inArray,
  isNotNull,
  ne,
  raidRun,
  raidSignup,
  type SQL,
  sql,
} from '@api/shared/util/db';

const FLAG_COLUMN = {
  leader: raidSignup.isLeader,
  darkRun: raidSignup.isDarkRun,
  formationCore: raidSignup.isFormationCore,
  reserved: raidSignup.isReserved,
} as const;

export class RaidSignupRepository {
  buildWhereClause(query: ListRaidSignupsQuery): SQL | undefined {
    const conditions: SQL[] = [
      isNotNull(raidSignup.characterName),
      ne(raidSignup.characterName, ''),
    ];

    if (query.characterName) {
      conditions.push(
        ilike(raidSignup.characterName, `%${query.characterName}%`),
      );
    }

    if (query.raidRunName) {
      conditions.push(ilike(raidRun.name, `%${query.raidRunName}%`));
    }

    if (query.serverId) {
      conditions.push(eq(raidSignup.serverId, query.serverId));
    }

    if (query.kungfuId) {
      conditions.push(eq(raidSignup.kungfuId, query.kungfuId));
    }

    if (query.role) {
      conditions.push(eq(raidSignup.role, query.role));
    }

    const flags = Array.isArray(query.flags)
      ? query.flags
      : query.flags
        ? [query.flags]
        : [];
    for (const flag of flags) {
      conditions.push(eq(FLAG_COLUMN[flag], true));
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select({
        id: raidSignup.id,
        raidRunId: raidSignup.raidRunId,
        raidRunName: raidRun.name,
        startTime: raidRun.startTime,
        dungeonName: gameDungeon.name,
        dungeonPlayerLimit: gameDungeon.playerLimit,
        dungeonDifficulty: gameDungeon.difficulty,
        role: raidSignup.role,
        status: raidSignup.status,
        isReserved: raidSignup.isReserved,
        isLeader: raidSignup.isLeader,
        isDarkRun: raidSignup.isDarkRun,
        isFormationCore: raidSignup.isFormationCore,
        characterName: raidSignup.characterName,
        serverName: gameServer.name,
        kungfuName: gameKungfu.name,
        createdAt: raidSignup.createdAt,
      })
      .from(raidSignup)
      .leftJoin(raidRun, eq(raidSignup.raidRunId, raidRun.id))
      .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
      .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
      .leftJoin(gameKungfu, eq(raidSignup.kungfuId, gameKungfu.id))
      .where(where)
      .orderBy(
        desc(raidRun.startTime),
        asc(raidSignup.groupNumber),
        asc(raidSignup.positionNumber),
      )
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db
      .select({ total: count() })
      .from(raidSignup)
      .leftJoin(raidRun, eq(raidSignup.raidRunId, raidRun.id))
      .where(where);
  }

  async findByRaidRunId(raidRunId: string) {
    return db
      .select()
      .from(raidSignup)
      .where(eq(raidSignup.raidRunId, raidRunId));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return db.select().from(raidSignup).where(inArray(raidSignup.id, ids));
  }

  searchByCharacterName(name: string, limit: number) {
    const pattern = `%${name}%`;
    const prefixPattern = `${name}%`;

    const latestSignups = db
      .selectDistinctOn([raidSignup.characterName, raidSignup.serverId], {
        id: raidSignup.id,
        characterName: raidSignup.characterName,
        serverId: raidSignup.serverId,
        kungfuId: raidSignup.kungfuId,
        schoolId: raidSignup.schoolId,
      })
      .from(raidSignup)
      .where(
        and(
          isNotNull(raidSignup.characterName),
          ilike(raidSignup.characterName, pattern),
        ),
      )
      .orderBy(
        raidSignup.characterName,
        raidSignup.serverId,
        desc(raidSignup.updatedAt),
      )
      .as('latest_signups');

    return db
      .select({
        id: latestSignups.id,
        characterName: latestSignups.characterName,
        serverId: latestSignups.serverId,
        serverName: gameServer.name,
        kungfuId: latestSignups.kungfuId,
        kungfuName: gameKungfu.name,
        schoolId: sql<
          string | null
        >`coalesce(${gameKungfu.schoolId}, ${latestSignups.schoolId})`,
        kungfuType: gameKungfu.kungfuType,
      })
      .from(latestSignups)
      .leftJoin(gameServer, eq(latestSignups.serverId, gameServer.id))
      .leftJoin(gameKungfu, eq(latestSignups.kungfuId, gameKungfu.id))
      .orderBy(
        sql`case
          when ${latestSignups.characterName} ilike ${name} then 0
          when ${latestSignups.characterName} ilike ${prefixPattern} then 1
          else 2
        end`,
        sql`char_length(${latestSignups.characterName})`,
        latestSignups.characterName,
      )
      .limit(limit);
  }
}

export const raidSignupRepository = new RaidSignupRepository();
