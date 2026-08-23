import { db, raidRun, raidSignup } from '@api/shared/util/db';

export type RaidRunInsert = typeof raidRun.$inferInsert;
export type RaidSignupInsert = typeof raidSignup.$inferInsert;

export class RaidRunRepository {
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
