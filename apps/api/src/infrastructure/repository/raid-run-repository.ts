import { db, eq, raidRun, raidSignup } from '@api/shared/util/db';

export type RaidRunInsert = typeof raidRun.$inferInsert;
export type RaidSignupInsert = typeof raidSignup.$inferInsert;

type RaidRunUpdate = Partial<
  Pick<
    RaidRunInsert,
    'gameRaidId' | 'totalIncome' | 'subsidyAmount' | 'wagePerPerson'
  >
>;

export class RaidRunRepository {
  async findById(id: string) {
    const result = await db
      .select()
      .from(raidRun)
      .where(eq(raidRun.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async updateById(id: string, values: RaidRunUpdate) {
    const [updated] = await db
      .update(raidRun)
      .set(values)
      .where(eq(raidRun.id, id))
      .returning();
    return updated ?? null;
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
