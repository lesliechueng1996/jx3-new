import type { ListKungfusQuery } from '@api/interface/schema/kungfu-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  gameKungfu,
  gameSchool,
  ilike,
  inArray,
  raidSignup,
  type SQL,
} from '@api/shared/util/db';

type KungfuInsert = typeof gameKungfu.$inferInsert;
type KungfuUpdate = Partial<
  Pick<
    KungfuInsert,
    | 'name'
    | 'schoolId'
    | 'kungfuType'
    | 'attackType'
    | 'attackMethod'
    | 'formationName'
    | 'formationEffect'
    | 'isPveExternalRecommended'
    | 'isPveInternalRecommended'
    | 'isUnlimited'
    | 'icon'
    | 'alias'
  >
>;

const kungfuSelect = {
  id: gameKungfu.id,
  name: gameKungfu.name,
  schoolId: gameKungfu.schoolId,
  schoolName: gameSchool.name,
  kungfuType: gameKungfu.kungfuType,
  attackType: gameKungfu.attackType,
  attackMethod: gameKungfu.attackMethod,
  formationName: gameKungfu.formationName,
  formationEffect: gameKungfu.formationEffect,
  isPveExternalRecommended: gameKungfu.isPveExternalRecommended,
  isPveInternalRecommended: gameKungfu.isPveInternalRecommended,
  isUnlimited: gameKungfu.isUnlimited,
  icon: gameKungfu.icon,
  alias: gameKungfu.alias,
  createdAt: gameKungfu.createdAt,
  updatedAt: gameKungfu.updatedAt,
};

export class KungfuRepository {
  buildWhereClause(query: ListKungfusQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(gameKungfu.name, `%${query.name}%`));
    }

    if (query.schoolId) {
      conditions.push(eq(gameKungfu.schoolId, query.schoolId));
    }

    if (query.kungfuType) {
      conditions.push(eq(gameKungfu.kungfuType, query.kungfuType));
    }

    if (query.attackType) {
      conditions.push(eq(gameKungfu.attackType, query.attackType));
    }

    if (query.attackMethod) {
      conditions.push(eq(gameKungfu.attackMethod, query.attackMethod));
    }

    if (query.isUnlimited !== undefined) {
      conditions.push(eq(gameKungfu.isUnlimited, query.isUnlimited));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listAll() {
    return db
      .select({
        id: gameKungfu.id,
        name: gameKungfu.name,
        schoolId: gameKungfu.schoolId,
        schoolName: gameSchool.name,
        kungfuType: gameKungfu.kungfuType,
        icon: gameKungfu.icon,
        alias: gameKungfu.alias,
      })
      .from(gameKungfu)
      .innerJoin(gameSchool, eq(gameKungfu.schoolId, gameSchool.id))
      .orderBy(gameKungfu.name);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select(kungfuSelect)
      .from(gameKungfu)
      .innerJoin(gameSchool, eq(gameKungfu.schoolId, gameSchool.id))
      .where(where)
      .orderBy(desc(gameKungfu.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(gameKungfu).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select(kungfuSelect)
      .from(gameKungfu)
      .innerJoin(gameSchool, eq(gameKungfu.schoolId, gameSchool.id))
      .where(eq(gameKungfu.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return db
      .select({
        id: gameKungfu.id,
        schoolId: gameKungfu.schoolId,
      })
      .from(gameKungfu)
      .where(inArray(gameKungfu.id, ids));
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(gameKungfu)
      .where(eq(gameKungfu.name, name))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      KungfuInsert,
      | 'name'
      | 'schoolId'
      | 'kungfuType'
      | 'attackType'
      | 'attackMethod'
      | 'formationName'
      | 'formationEffect'
      | 'isPveExternalRecommended'
      | 'isPveInternalRecommended'
      | 'isUnlimited'
      | 'icon'
      | 'alias'
    >,
  ) {
    const [created] = await db.insert(gameKungfu).values(values).returning();
    return created;
  }

  async updateById(id: string, values: KungfuUpdate) {
    const [updated] = await db
      .update(gameKungfu)
      .set(values)
      .where(eq(gameKungfu.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameKungfu).where(eq(gameKungfu.id, id));
  }

  async isReferenced(id: string) {
    const [signup] = await db
      .select({ id: raidSignup.id })
      .from(raidSignup)
      .where(eq(raidSignup.kungfuId, id))
      .limit(1);

    return Boolean(signup);
  }

  async countByIds(ids: string[]) {
    const result = await db
      .select({ total: count() })
      .from(gameKungfu)
      .where(inArray(gameKungfu.id, ids));
    return result[0]?.total ?? 0;
  }
}

export const kungfuRepository = new KungfuRepository();
