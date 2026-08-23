import {
  and,
  db,
  desc,
  eq,
  gameKungfu,
  gameServer,
  ilike,
  isNotNull,
  raidSignup,
  sql,
} from '@api/shared/util/db';

export class RaidSignupRepository {
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
