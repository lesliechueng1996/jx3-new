import { account, db, eq, inArray } from '@api/shared/util/db';

export class AccountRepository {
  findAccountsByProvider(providerId: string) {
    return db
      .select({ userId: account.userId })
      .from(account)
      .where(eq(account.providerId, providerId));
  }

  findAccountsByUserIds(userIds: string[]) {
    return db
      .select({
        userId: account.userId,
        providerId: account.providerId,
      })
      .from(account)
      .where(inArray(account.userId, userIds));
  }
}

export const accountRepository = new AccountRepository();
