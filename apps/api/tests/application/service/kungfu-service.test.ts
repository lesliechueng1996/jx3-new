import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateKungfuBody,
  ListKungfusQuery,
  UpdateKungfuBody,
} from '@api/interface/schema/kungfu-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type KungfuRow = {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  kungfuType: 'defense' | 'heal' | 'attack';
  attackType: 'internal' | 'external' | null;
  attackMethod: 'melee' | 'ranged' | null;
  formationName: string | null;
  formationEffect: string | null;
  isPveExternalRecommended: boolean;
  isPveInternalRecommended: boolean;
  isUnlimited: boolean;
  icon: string | null;
  alias: string[];
  createdAt: Date;
  updatedAt: Date;
};

type KungfuInsertRow = Omit<KungfuRow, 'schoolName'>;

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

const kungfuRow = (overrides: Partial<KungfuRow> = {}): KungfuRow => ({
  id: 'kungfu-1',
  name: '紫霞功',
  schoolId: 'school-1',
  schoolName: '纯阳',
  kungfuType: 'attack',
  attackType: 'internal',
  attackMethod: 'ranged',
  formationName: '紫霞',
  formationEffect: '提高内功攻击',
  isPveExternalRecommended: false,
  isPveInternalRecommended: true,
  isUnlimited: false,
  icon: '/icons/zixia.png',
  alias: ['气纯'],
  createdAt,
  updatedAt,
  ...overrides,
});

const insertRow = (
  overrides: Partial<KungfuInsertRow> = {},
): KungfuInsertRow => {
  const { schoolName: _schoolName, ...row } = kungfuRow(overrides);
  return { ...row, ...overrides };
};

const schoolRow = (overrides: Partial<SchoolRow> = {}): SchoolRow => ({
  id: 'school-1',
  name: '纯阳',
  type: 'school',
  icon: null,
  alias: [],
  createdAt,
  updatedAt,
  ...overrides,
});

const buildWhereClause = mock<(query: ListKungfusQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<KungfuRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<KungfuRow | null>>(() =>
  Promise.resolve(null),
);
const findByName = mock<(id: string) => Promise<KungfuInsertRow | null>>(() =>
  Promise.resolve(null),
);
const create = mock<(values: unknown) => Promise<KungfuInsertRow>>(() =>
  Promise.resolve(insertRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<KungfuInsertRow | null>
>(() => Promise.resolve(insertRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const findSchoolById = mock<(id: string) => Promise<SchoolRow | null>>(() =>
  Promise.resolve(null),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/kungfu-repository', () => ({
  kungfuRepository: {
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

mock.module('@api/infrastructure/repository/school-repository', () => ({
  schoolRepository: {
    findById: findSchoolById,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

const {
  listAdminKungfus,
  getAdminKungfu,
  createAdminKungfu,
  updateAdminKungfu,
  deleteAdminKungfu,
} = await import('@api/application/service/kungfu-service');

const listQuery = (
  overrides: Partial<ListKungfusQuery> = {},
): ListKungfusQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

const createBody = (
  overrides: Partial<CreateKungfuBody> = {},
): CreateKungfuBody => ({
  name: '紫霞功',
  schoolId: 'school-1',
  kungfuType: 'attack',
  ...overrides,
});

describe('kungfu-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findByName.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    findSchoolById.mockReset();
    formatDateTime.mockClear();

    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findByName.mockResolvedValue(null);
    create.mockResolvedValue(insertRow());
    updateById.mockResolvedValue(insertRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
    findSchoolById.mockResolvedValue(schoolRow());
  });

  it('lists kungfus and maps rows', async () => {
    listPagination.mockResolvedValue([kungfuRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminKungfus(
      listQuery({
        name: '紫',
        schoolId: 'school-1',
        kungfuType: 'attack',
        isUnlimited: false,
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'kungfu-1',
          name: '紫霞功',
          schoolId: 'school-1',
          schoolName: '纯阳',
          kungfuType: 'attack',
          attackType: 'internal',
          attackMethod: 'ranged',
          formationName: '紫霞',
          formationEffect: '提高内功攻击',
          isPveExternalRecommended: false,
          isPveInternalRecommended: true,
          isUnlimited: false,
          icon: '/icons/zixia.png',
          alias: ['气纯'],
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

    const result = await listAdminKungfus(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets a kungfu and throws when missing', async () => {
    findById.mockResolvedValueOnce(kungfuRow({ kungfuType: 'heal' }));
    await expect(getAdminKungfu('kungfu-1')).resolves.toMatchObject({
      id: 'kungfu-1',
      kungfuType: 'heal',
      schoolName: '纯阳',
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminKungfu('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminKungfu('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.KUNGFU_NOT_FOUND,
      );
    }
  });

  it('creates a kungfu and normalizes optional fields', async () => {
    const body: CreateKungfuBody = {
      name: ' 紫霞功 ',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: ' 紫霞 ',
      formationEffect: ' 提高内功攻击 ',
      isPveExternalRecommended: false,
      isPveInternalRecommended: true,
      isUnlimited: true,
      icon: '  /icons/zixia.png  ',
      alias: [' 气纯 ', '', '气纯', '气宗'],
    };

    await createAdminKungfu(body);

    expect(findByName).toHaveBeenCalledWith('紫霞功');
    expect(findSchoolById).toHaveBeenCalledWith('school-1');
    expect(create).toHaveBeenCalledWith({
      name: '紫霞功',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '紫霞',
      formationEffect: '提高内功攻击',
      isPveExternalRecommended: false,
      isPveInternalRecommended: true,
      isUnlimited: true,
      icon: '/icons/zixia.png',
      alias: ['气纯', '气宗'],
    });
  });

  it('stores defaults when optional create fields are omitted', async () => {
    await createAdminKungfu(createBody({ name: '太虚剑意' }));

    expect(create).toHaveBeenCalledWith({
      name: '太虚剑意',
      schoolId: 'school-1',
      kungfuType: 'attack',
      attackType: null,
      attackMethod: null,
      formationName: null,
      formationEffect: null,
      isPveExternalRecommended: false,
      isPveInternalRecommended: false,
      isUnlimited: false,
      icon: null,
      alias: [],
    });
  });

  it('stores null text fields when create receives blank or null', async () => {
    await createAdminKungfu(
      createBody({
        icon: '   ',
        formationName: null,
        formationEffect: '   ',
      }),
    );
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      icon: null,
      formationName: null,
      formationEffect: null,
    });
  });

  it('rejects a missing school on create', async () => {
    findSchoolById.mockResolvedValue(null);

    await expect(createAdminKungfu(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate kungfu name on create', async () => {
    findByName.mockResolvedValue(insertRow());

    await expect(createAdminKungfu(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.KUNGFU_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates a kungfu including name uniqueness against others', async () => {
    findById.mockResolvedValue(kungfuRow());
    findByName.mockResolvedValue(null);
    findSchoolById.mockResolvedValue(
      schoolRow({ id: 'school-2', name: '万花' }),
    );

    const body: UpdateKungfuBody = {
      name: ' 花间游 ',
      schoolId: 'school-2',
      kungfuType: 'heal',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '花间',
      formationEffect: '治疗',
      isPveExternalRecommended: true,
      isPveInternalRecommended: false,
      isUnlimited: true,
      icon: 'icon.png',
      alias: ['花间'],
    };

    await updateAdminKungfu('kungfu-1', body);

    expect(findByName).toHaveBeenCalledWith('花间游');
    expect(updateById).toHaveBeenCalledWith('kungfu-1', {
      name: '花间游',
      schoolId: 'school-2',
      kungfuType: 'heal',
      attackType: 'internal',
      attackMethod: 'ranged',
      formationName: '花间',
      formationEffect: '治疗',
      isPveExternalRecommended: true,
      isPveInternalRecommended: false,
      isUnlimited: true,
      icon: 'icon.png',
      alias: ['花间'],
    });
  });

  it('allows keeping the current name on update', async () => {
    findById.mockResolvedValue(kungfuRow());
    findByName.mockResolvedValue(insertRow());

    await updateAdminKungfu('kungfu-1', { name: '紫霞功' });

    expect(updateById).toHaveBeenCalledWith('kungfu-1', { name: '紫霞功' });
  });

  it('rejects renaming to another kungfu name', async () => {
    findById.mockResolvedValue(kungfuRow());
    findByName.mockResolvedValue(
      insertRow({ id: 'kungfu-2', name: '太虚剑意' }),
    );

    await expect(
      updateAdminKungfu('kungfu-1', { name: '太虚剑意' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the kungfu disappears during update', async () => {
    findById.mockResolvedValue(kungfuRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminKungfu('kungfu-1', { kungfuType: 'defense' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.KUNGFU_NOT_FOUND,
    });
  });

  it('rejects a missing school on update', async () => {
    findById.mockResolvedValue(kungfuRow());
    findSchoolById.mockResolvedValue(null);

    await expect(
      updateAdminKungfu('kungfu-1', { schoolId: 'missing' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('clears optional fields on update', async () => {
    findById.mockResolvedValue(kungfuRow());

    await updateAdminKungfu('kungfu-1', {
      attackType: null,
      attackMethod: null,
      formationName: '  ',
      formationEffect: null,
      icon: null,
      alias: ['  ', ''],
    });

    expect(updateById).toHaveBeenCalledWith('kungfu-1', {
      attackType: null,
      attackMethod: null,
      formationName: null,
      formationEffect: null,
      icon: null,
      alias: [],
    });
  });

  it('deletes a kungfu that is not referenced', async () => {
    findById.mockResolvedValue(kungfuRow());

    await deleteAdminKungfu('kungfu-1');

    expect(isReferenced).toHaveBeenCalledWith('kungfu-1');
    expect(deleteById).toHaveBeenCalledWith('kungfu-1');
  });

  it('rejects deleting a referenced kungfu', async () => {
    findById.mockResolvedValue(kungfuRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminKungfu('kungfu-1')).rejects.toMatchObject({
      code: ERROR_CODES.KUNGFU_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing kungfu', async () => {
    await expect(deleteAdminKungfu('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
