import {
  and,
  asc,
  db,
  eq,
  gameDungeon,
  inArray,
  raidRun,
  raidSignup,
} from '@api/shared/util/db';

export type RaidRunInsert = typeof raidRun.$inferInsert;
export type RaidSignupInsert = typeof raidSignup.$inferInsert;

type RaidRunUpdate = Partial<
  Pick<
    RaidRunInsert,
    | 'name'
    | 'description'
    | 'dungeonId'
    | 'gatherTime'
    | 'startTime'
    | 'endTime'
    | 'reservedTank'
    | 'reservedHealer'
    | 'reservedDps'
    | 'reservedBoss'
    | 'remark'
    | 'status'
    | 'gameRaidId'
    | 'totalIncome'
    | 'subsidyAmount'
    | 'wagePerPerson'
  >
>;

type SignupWriteFields = Pick<
  RaidSignupInsert,
  | 'groupNumber'
  | 'positionNumber'
  | 'role'
  | 'isLeader'
  | 'isDarkRun'
  | 'isFormationCore'
  | 'serverId'
  | 'characterName'
  | 'schoolId'
  | 'kungfuId'
  | 'remark'
  | 'id'
>;

export type RaidSignupSync = {
  toUpdate: Array<SignupWriteFields & { id: string }>;
  toInsert: Array<SignupWriteFields & { createdBy: string }>;
  toDeleteIds: string[];
};

const dungeonSelect = {
  id: gameDungeon.id,
  name: gameDungeon.name,
  playerLimit: gameDungeon.playerLimit,
  bossCount: gameDungeon.bossCount,
  difficulty: gameDungeon.difficulty,
};

export class RaidRunRepository {
  async findById(id: string) {
    const result = await db
      .select()
      .from(raidRun)
      .where(eq(raidRun.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findDetailById(id: string) {
    const run = await this.findById(id);
    if (!run) {
      return null;
    }

    const [dungeon] = await db
      .select(dungeonSelect)
      .from(gameDungeon)
      .where(eq(gameDungeon.id, run.dungeonId))
      .limit(1);

    const signups = await db
      .select()
      .from(raidSignup)
      .where(eq(raidSignup.raidRunId, id))
      .orderBy(asc(raidSignup.groupNumber), asc(raidSignup.positionNumber));

    return {
      run,
      dungeon: dungeon ?? null,
      signups,
    };
  }

  async updateById(id: string, values: RaidRunUpdate) {
    const [updated] = await db
      .update(raidRun)
      .set(values)
      .where(eq(raidRun.id, id))
      .returning();
    return updated ?? null;
  }

  async updateWithSignups(
    id: string,
    values: RaidRunUpdate,
    sync: RaidSignupSync,
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(raidRun)
        .set(values)
        .where(eq(raidRun.id, id))
        .returning();

      if (!updated) {
        return null;
      }

      if (sync.toDeleteIds.length > 0) {
        await tx
          .delete(raidSignup)
          .where(
            and(
              eq(raidSignup.raidRunId, id),
              inArray(raidSignup.id, sync.toDeleteIds),
            ),
          );
      }

      for (const signup of sync.toUpdate) {
        const { id: signupId, ...fields } = signup;
        await tx
          .update(raidSignup)
          .set(fields)
          .where(
            and(eq(raidSignup.id, signupId), eq(raidSignup.raidRunId, id)),
          );
      }

      if (sync.toInsert.length > 0) {
        await tx.insert(raidSignup).values(
          sync.toInsert.map((signup) => ({
            ...signup,
            raidRunId: id,
            isReserved: false,
          })),
        );
      }

      return updated;
    });
  }

  async createWithSignups(
    data: RaidRunInsert & { signups: Omit<RaidSignupInsert, 'raidRunId'>[] },
  ) {
    const { signups, ...raidRunValues } = data;

    return await db.transaction(async (tx) => {
      const [raidRunRecord] = await tx
        .insert(raidRun)
        .values(raidRunValues)
        .returning();

      if (signups.length > 0) {
        await tx.insert(raidSignup).values(
          signups.map((signup) => ({
            ...signup,
            raidRunId: raidRunRecord.id,
            isReserved: false,
          })),
        );
      }

      return raidRunRecord;
    });
  }
}

export const raidRunRepository = new RaidRunRepository();
