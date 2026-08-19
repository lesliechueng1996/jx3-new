import type { ListSchoolsQuery } from '@api/interface/schema/school-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  gameCharacter,
  gameKungfu,
  gameSchool,
  ilike,
  playerBlocklist,
  raidSignup,
  type SQL,
} from '@api/shared/util/db';

type SchoolInsert = typeof gameSchool.$inferInsert;
type SchoolUpdate = Partial<
  Pick<typeof gameSchool.$inferInsert, 'name' | 'type' | 'icon' | 'alias'>
>;

export class SchoolRepository {
  buildWhereClause(query: ListSchoolsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(gameSchool.name, `%${query.name}%`));
    }

    if (query.type) {
      conditions.push(eq(gameSchool.type, query.type));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(gameSchool)
      .where(where)
      .orderBy(desc(gameSchool.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(gameSchool).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameSchool)
      .where(eq(gameSchool.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(gameSchool)
      .where(eq(gameSchool.name, name))
      .limit(1);
    return result[0] ?? null;
  }

  async create(values: Pick<SchoolInsert, 'name' | 'type' | 'icon' | 'alias'>) {
    const [created] = await db.insert(gameSchool).values(values).returning();
    return created;
  }

  async updateById(id: string, values: SchoolUpdate) {
    const [updated] = await db
      .update(gameSchool)
      .set(values)
      .where(eq(gameSchool.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameSchool).where(eq(gameSchool.id, id));
  }

  async isReferenced(id: string) {
    const [kungfu, character, signup, blocklist] = await Promise.all([
      db
        .select({ id: gameKungfu.id })
        .from(gameKungfu)
        .where(eq(gameKungfu.schoolId, id))
        .limit(1),
      db
        .select({ id: gameCharacter.id })
        .from(gameCharacter)
        .where(eq(gameCharacter.schoolId, id))
        .limit(1),
      db
        .select({ id: raidSignup.id })
        .from(raidSignup)
        .where(eq(raidSignup.schoolId, id))
        .limit(1),
      db
        .select({ id: playerBlocklist.id })
        .from(playerBlocklist)
        .where(eq(playerBlocklist.schoolId, id))
        .limit(1),
    ]);

    return Boolean(kungfu[0] || character[0] || signup[0] || blocklist[0]);
  }
}

export const schoolRepository = new SchoolRepository();
