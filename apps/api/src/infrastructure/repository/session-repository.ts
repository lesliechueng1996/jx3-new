import { db, desc, inArray, session } from '@api/shared/util/db';

export class SessionRepository {
  findSessionsByUserIds(userIds: string[]) {
    return db
      .select({
        userId: session.userId,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
      })
      .from(session)
      .where(inArray(session.userId, userIds))
      .orderBy(desc(session.createdAt));
  }
}

export const sessionRepository = new SessionRepository();
