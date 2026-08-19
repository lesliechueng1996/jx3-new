import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateSchoolBody,
  ListSchoolsQuery,
  UpdateSchoolBody,
} from '@api/interface/schema/school-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type SchoolPublicRow = {
  id: string;
  name: string;
  type: 'school' | 'genre';
  icon: string | null;
  alias: string[];
};

type SchoolRow = {
  id: string;
  name: string;
  type: 'school' | 'genre';
  icon: string | null;
  alias: string[];
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const schoolRow = (overrides: Partial<SchoolRow> = {}): SchoolRow => ({
  id: 'school-1',
  name: '纯阳',
  type: 'school',
  icon: '/icons/chunyang.png',
  alias: ['纯阳宫'],
  createdAt,
  updatedAt,
  ...overrides,
});

const buildWhereClause = mock<(query: ListSchoolsQuery) => unknown>(
  () => undefined,
);
const listAll = mock<() => Promise<SchoolPublicRow[]>>(() =>
  Promise.resolve([]),
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<SchoolRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<SchoolRow | null>>(() =>
  Promise.resolve(null),
);
const findByName = mock<(name: string) => Promise<SchoolRow | null>>(() =>
  Promise.resolve(null),
);
const create = mock<(values: unknown) => Promise<SchoolRow>>(() =>
  Promise.resolve(schoolRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<SchoolRow | null>
>(() => Promise.resolve(schoolRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/school-repository', () => ({
  schoolRepository: {
    listAll,
    buildWhereClause,
    listPagination,
    count,
    findById,
    findByName,
    create,
    updateById,
    deleteById,
    isReferenced,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

const {
  listAllSchools,
  listAdminSchools,
  getAdminSchool,
  createAdminSchool,
  updateAdminSchool,
  deleteAdminSchool,
} = await import('@api/application/service/school-service');

const listQuery = (
  overrides: Partial<ListSchoolsQuery> = {},
): ListSchoolsQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('school-service', () => {
  beforeEach(() => {
    listAll.mockReset();
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findByName.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    formatDateTime.mockClear();

    listAll.mockResolvedValue([]);
    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findByName.mockResolvedValue(null);
    create.mockResolvedValue(schoolRow());
    updateById.mockResolvedValue(schoolRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
  });

  it('lists all schools without timestamps', async () => {
    listAll.mockResolvedValue([
      {
        id: 'school-1',
        name: '纯阳',
        type: 'school',
        icon: '/icons/chunyang.png',
        alias: ['纯阳宫'],
      },
    ]);

    await expect(listAllSchools()).resolves.toEqual([
      {
        id: 'school-1',
        name: '纯阳',
        type: 'school',
        icon: '/icons/chunyang.png',
        alias: ['纯阳宫'],
      },
    ]);
  });

  it('lists schools and maps rows', async () => {
    listPagination.mockResolvedValue([schoolRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminSchools(
      listQuery({ name: '纯', type: 'school', page: 2, pageSize: 10 }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'school-1',
          name: '纯阳',
          type: 'school',
          icon: '/icons/chunyang.png',
          alias: ['纯阳宫'],
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('defaults list total to 0 when count is empty', async () => {
    count.mockResolvedValue([]);

    const result = await listAdminSchools(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets a school and throws when missing', async () => {
    findById.mockResolvedValueOnce(schoolRow({ type: 'genre', icon: null }));
    await expect(getAdminSchool('school-1')).resolves.toMatchObject({
      id: 'school-1',
      type: 'genre',
      icon: null,
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminSchool('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminSchool('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.SCHOOL_NOT_FOUND,
      );
    }
  });

  it('creates a school and normalizes alias and icon', async () => {
    const body: CreateSchoolBody = {
      name: ' 万花 ',
      type: 'school',
      icon: '  /icons/wanhua.png  ',
      alias: [' 花间 ', '', '花间', '万花'],
    };

    await createAdminSchool(body);

    expect(findByName).toHaveBeenCalledWith('万花');
    expect(create).toHaveBeenCalledWith({
      name: '万花',
      type: 'school',
      icon: '/icons/wanhua.png',
      alias: ['花间', '万花'],
    });
  });

  it('stores null icon and empty alias when omitted', async () => {
    await createAdminSchool({ name: '少林', type: 'genre' });

    expect(create).toHaveBeenCalledWith({
      name: '少林',
      type: 'genre',
      icon: null,
      alias: [],
    });
  });

  it('stores null icon when create receives blank or null', async () => {
    await createAdminSchool({ name: '藏剑', type: 'school', icon: '   ' });
    expect(create.mock.calls[0]?.[0]).toMatchObject({ icon: null });

    await createAdminSchool({ name: '五毒', type: 'school', icon: null });
    expect(create.mock.calls[1]?.[0]).toMatchObject({ icon: null });
  });

  it('rejects a duplicate school name on create', async () => {
    findByName.mockResolvedValue(schoolRow());

    await expect(
      createAdminSchool({ name: '纯阳', type: 'school' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.SCHOOL_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates a school including name uniqueness against others', async () => {
    findById.mockResolvedValue(schoolRow());
    findByName.mockResolvedValue(null);

    const body: UpdateSchoolBody = {
      name: ' 纯阳宫 ',
      type: 'genre',
      icon: 'icon.png',
      alias: ['纯阳'],
    };

    await updateAdminSchool('school-1', body);

    expect(findByName).toHaveBeenCalledWith('纯阳宫');
    expect(updateById).toHaveBeenCalledWith('school-1', {
      name: '纯阳宫',
      type: 'genre',
      icon: 'icon.png',
      alias: ['纯阳'],
    });
  });

  it('allows keeping the current name on update', async () => {
    findById.mockResolvedValue(schoolRow());
    findByName.mockResolvedValue(schoolRow());

    await updateAdminSchool('school-1', { name: '纯阳' });

    expect(updateById).toHaveBeenCalledWith('school-1', { name: '纯阳' });
  });

  it('rejects renaming to another school name', async () => {
    findById.mockResolvedValue(schoolRow());
    findByName.mockResolvedValue(schoolRow({ id: 'school-2', name: '万花' }));

    await expect(
      updateAdminSchool('school-1', { name: '万花' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the school disappears during update', async () => {
    findById.mockResolvedValue(schoolRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminSchool('school-1', { type: 'genre' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
    });
  });

  it('clears icon and alias on update', async () => {
    findById.mockResolvedValue(schoolRow());

    await updateAdminSchool('school-1', { icon: null, alias: ['  ', ''] });

    expect(updateById).toHaveBeenCalledWith('school-1', {
      icon: null,
      alias: [],
    });
  });

  it('deletes a school that is not referenced', async () => {
    findById.mockResolvedValue(schoolRow());

    await deleteAdminSchool('school-1');

    expect(isReferenced).toHaveBeenCalledWith('school-1');
    expect(deleteById).toHaveBeenCalledWith('school-1');
  });

  it('rejects deleting a referenced school', async () => {
    findById.mockResolvedValue(schoolRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminSchool('school-1')).rejects.toMatchObject({
      code: ERROR_CODES.SCHOOL_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing school', async () => {
    await expect(deleteAdminSchool('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
