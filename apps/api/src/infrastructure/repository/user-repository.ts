import type { ListUsersQuery } from '@api/interface/schema/user-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  type SQL,
  user,
} from '@api/shared/util/db';
import { accountRepository } from './account-repository';

export class UserRepository {
  buildWhereClause(query: ListUsersQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(user.name, `%${query.name}%`));
    }

    if (query.email) {
      conditions.push(ilike(user.email, `%${query.email}%`));
    }

    if (query.role) {
      conditions.push(eq(user.role, query.role));
    }

    if (query.banned !== undefined) {
      conditions.push(eq(user.banned, query.banned));
    }

    if (query.provider) {
      conditions.push(
        inArray(
          user.id,
          accountRepository.findAccountsByProvider(query.provider),
        ),
      );
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(user).where(where);
  }
}

export const userRepository = new UserRepository();
