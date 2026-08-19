import { kungfuRepository } from '@api/infrastructure/repository/kungfu-repository';
import { schoolRepository } from '@api/infrastructure/repository/school-repository';
import type {
  CreateKungfuBody,
  KungfuDetail,
  ListKungfusQuery,
  UpdateKungfuBody,
} from '@api/interface/schema/kungfu-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';

type KungfuRow = NonNullable<
  Awaited<ReturnType<typeof kungfuRepository.findById>>
>;

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

const normalizeNullableText = (
  value: string | null | undefined,
): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toKungfuDetail = (
  row:
    | KungfuRow
    | (NonNullable<Awaited<ReturnType<typeof kungfuRepository.create>>> & {
        schoolName: string;
      }),
): KungfuDetail => ({
  id: row.id,
  name: row.name,
  schoolId: row.schoolId,
  schoolName: row.schoolName,
  kungfuType: row.kungfuType,
  attackType: row.attackType,
  attackMethod: row.attackMethod,
  formationName: row.formationName,
  formationEffect: row.formationEffect,
  isPveExternalRecommended: row.isPveExternalRecommended,
  isPveInternalRecommended: row.isPveInternalRecommended,
  isUnlimited: row.isUnlimited,
  icon: row.icon,
  alias: row.alias,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findKungfuOrThrow = async (id: string): Promise<KungfuRow> => {
  const row = await kungfuRepository.findById(id);
  if (!row) {
    throw new NotFoundException('心法不存在', ERROR_CODES.KUNGFU_NOT_FOUND);
  }
  return row;
};

const findSchoolOrThrow = async (id: string): Promise<SchoolRow> => {
  const row = await schoolRepository.findById(id);
  if (!row) {
    throw new NotFoundException('门派不存在', ERROR_CODES.SCHOOL_NOT_FOUND);
  }
  return row;
};

const assertNameAvailable = async (name: string, excludeId?: string) => {
  const existing = await kungfuRepository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '心法名称已存在',
      ERROR_CODES.KUNGFU_NAME_ALREADY_EXISTS,
    );
  }
};

export const listAdminKungfus = async (
  query: ListKungfusQuery,
): Promise<{
  items: KungfuDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = kungfuRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    kungfuRepository.listPagination(where, query.pageSize, offset),
    kungfuRepository.count(where),
  ]);

  return {
    items: rows.map(toKungfuDetail),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminKungfu = async (id: string): Promise<KungfuDetail> => {
  const row = await findKungfuOrThrow(id);
  return toKungfuDetail(row);
};

export const createAdminKungfu = async (
  body: CreateKungfuBody,
): Promise<KungfuDetail> => {
  const name = body.name.trim();
  await assertNameAvailable(name);
  const school = await findSchoolOrThrow(body.schoolId);

  const created = await kungfuRepository.create({
    name,
    schoolId: body.schoolId,
    kungfuType: body.kungfuType,
    attackType: body.attackType ?? null,
    attackMethod: body.attackMethod ?? null,
    formationName: normalizeNullableText(body.formationName),
    formationEffect: normalizeNullableText(body.formationEffect),
    isPveExternalRecommended: body.isPveExternalRecommended ?? false,
    isPveInternalRecommended: body.isPveInternalRecommended ?? false,
    isUnlimited: body.isUnlimited ?? false,
    icon: normalizeNullableText(body.icon),
    alias: normalizeAlias(body.alias),
  });

  return toKungfuDetail({ ...created, schoolName: school.name });
};

export const updateAdminKungfu = async (
  id: string,
  body: UpdateKungfuBody,
): Promise<KungfuDetail> => {
  const existing = await findKungfuOrThrow(id);

  const values: Parameters<typeof kungfuRepository.updateById>[1] = {};
  let schoolName = existing.schoolName;

  if (body.name !== undefined) {
    const name = body.name.trim();
    await assertNameAvailable(name, id);
    values.name = name;
  }

  if (body.schoolId !== undefined) {
    const school = await findSchoolOrThrow(body.schoolId);
    values.schoolId = body.schoolId;
    schoolName = school.name;
  }

  if (body.kungfuType !== undefined) {
    values.kungfuType = body.kungfuType;
  }

  if (body.attackType !== undefined) {
    values.attackType = body.attackType;
  }

  if (body.attackMethod !== undefined) {
    values.attackMethod = body.attackMethod;
  }

  if (body.formationName !== undefined) {
    values.formationName = normalizeNullableText(body.formationName);
  }

  if (body.formationEffect !== undefined) {
    values.formationEffect = normalizeNullableText(body.formationEffect);
  }

  if (body.isPveExternalRecommended !== undefined) {
    values.isPveExternalRecommended = body.isPveExternalRecommended;
  }

  if (body.isPveInternalRecommended !== undefined) {
    values.isPveInternalRecommended = body.isPveInternalRecommended;
  }

  if (body.isUnlimited !== undefined) {
    values.isUnlimited = body.isUnlimited;
  }

  if (body.icon !== undefined) {
    values.icon = normalizeNullableText(body.icon);
  }

  if (body.alias !== undefined) {
    values.alias = normalizeAlias(body.alias);
  }

  const updated = await kungfuRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException('心法不存在', ERROR_CODES.KUNGFU_NOT_FOUND);
  }

  return toKungfuDetail({ ...updated, schoolName });
};

export const deleteAdminKungfu = async (id: string): Promise<void> => {
  await findKungfuOrThrow(id);

  const inUse = await kungfuRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '心法已被引用，无法删除',
      ERROR_CODES.KUNGFU_IN_USE,
    );
  }

  await kungfuRepository.deleteById(id);
};
