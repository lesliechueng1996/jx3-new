import { schoolRepository } from '@api/infrastructure/repository/school-repository';
import type {
  CreateSchoolBody,
  ListSchoolsQuery,
  SchoolDetail,
  SchoolPublic,
  UpdateSchoolBody,
} from '@api/interface/schema/school-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';

type SchoolRow = NonNullable<
  Awaited<ReturnType<typeof schoolRepository.findById>>
>;

const normalizeAlias = (alias: string[] | undefined): string[] => {
  if (!alias) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of alias) {
    const trimmed = item.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
};

const normalizeIcon = (icon: string | null | undefined): string | null => {
  if (icon === undefined || icon === null) {
    return null;
  }

  const trimmed = icon.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toSchoolDetail = (row: SchoolRow): SchoolDetail => ({
  id: row.id,
  name: row.name,
  type: row.type,
  icon: row.icon,
  alias: row.alias,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findSchoolOrThrow = async (id: string): Promise<SchoolRow> => {
  const row = await schoolRepository.findById(id);
  if (!row) {
    throw new NotFoundException('门派不存在', ERROR_CODES.SCHOOL_NOT_FOUND);
  }
  return row;
};

const assertNameAvailable = async (name: string, excludeId?: string) => {
  const existing = await schoolRepository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '门派名称已存在',
      ERROR_CODES.SCHOOL_NAME_ALREADY_EXISTS,
    );
  }
};

export const listAllSchools = async (): Promise<SchoolPublic[]> => {
  return schoolRepository.listAll();
};

export const listAdminSchools = async (
  query: ListSchoolsQuery,
): Promise<{
  items: SchoolDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = schoolRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    schoolRepository.listPagination(where, query.pageSize, offset),
    schoolRepository.count(where),
  ]);

  return {
    items: rows.map(toSchoolDetail),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminSchool = async (id: string): Promise<SchoolDetail> => {
  const row = await findSchoolOrThrow(id);
  return toSchoolDetail(row);
};

export const createAdminSchool = async (
  body: CreateSchoolBody,
): Promise<SchoolDetail> => {
  const name = body.name.trim();
  await assertNameAvailable(name);

  const created = await schoolRepository.create({
    name,
    type: body.type,
    icon: normalizeIcon(body.icon),
    alias: normalizeAlias(body.alias),
  });

  return toSchoolDetail(created);
};

export const updateAdminSchool = async (
  id: string,
  body: UpdateSchoolBody,
): Promise<SchoolDetail> => {
  await findSchoolOrThrow(id);

  const values: Parameters<typeof schoolRepository.updateById>[1] = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    await assertNameAvailable(name, id);
    values.name = name;
  }

  if (body.type !== undefined) {
    values.type = body.type;
  }

  if (body.icon !== undefined) {
    values.icon = normalizeIcon(body.icon);
  }

  if (body.alias !== undefined) {
    values.alias = normalizeAlias(body.alias);
  }

  const updated = await schoolRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException('门派不存在', ERROR_CODES.SCHOOL_NOT_FOUND);
  }

  return toSchoolDetail(updated);
};

export const deleteAdminSchool = async (id: string): Promise<void> => {
  await findSchoolOrThrow(id);

  const inUse = await schoolRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '门派已被引用，无法删除',
      ERROR_CODES.SCHOOL_IN_USE,
    );
  }

  await schoolRepository.deleteById(id);
};
