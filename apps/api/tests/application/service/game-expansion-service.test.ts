import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameExpansionBody,
  UpdateGameExpansionBody,
} from '@api/interface/schema/game-expansion-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type GameExpansionRow = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  startDate: string;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type GameSeasonRow = {
  id: string;
  expansionId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const expansionRow = (
  overrides: Partial<GameExpansionRow> = {},
): GameExpansionRow => ({
  id: 'expansion-1',
  name: '江湖',
  description: '描述',
  level: 120,
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  createdAt,
  updatedAt,
  ...overrides,
});

const seasonRow = (overrides: Partial<GameSeasonRow> = {}): GameSeasonRow => ({
  id: 'season-1',
  expansionId: 'expansion-1',
  name: 'S1',
  description: null,
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 0,
  createdAt,
  updatedAt,
  ...overrides,
});

const listAll = mock<() => Promise<GameExpansionRow[]>>(() =>
  Promise.resolve([]),
);
const findById = mock<(id: string) => Promise<GameExpansionRow | null>>(() =>
  Promise.resolve(null),
);
const findByName = mock<(name: string) => Promise<GameExpansionRow | null>>(
  () => Promise.resolve(null),
);
const create = mock<(values: unknown) => Promise<GameExpansionRow>>(() =>
  Promise.resolve(expansionRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameExpansionRow | null>
>(() => Promise.resolve(expansionRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const listByExpansionId = mock<(id: string) => Promise<GameSeasonRow[]>>(() =>
  Promise.resolve([]),
);
const existsByExpansionId = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/game-expansion-repository', () => ({
  gameExpansionRepository: {
    listAll,
    findById,
    findByName,
    create,
    updateById,
    deleteById,
    isReferenced,
  },
}));

mock.module('@api/infrastructure/repository/game-season-repository', () => ({
  gameSeasonRepository: {
    listByExpansionId,
    existsByExpansionId,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

const {
  listAdminGameExpansions,
  getAdminGameExpansion,
  createAdminGameExpansion,
  updateAdminGameExpansion,
  deleteAdminGameExpansion,
} = await import('@api/application/service/game-expansion-service');

describe('game-expansion-service', () => {
  beforeEach(() => {
    listAll.mockReset();
    findById.mockReset();
    findByName.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    listByExpansionId.mockReset();
    existsByExpansionId.mockReset();
    formatDateTime.mockClear();

    listAll.mockResolvedValue([]);
    findById.mockResolvedValue(null);
    findByName.mockResolvedValue(null);
    create.mockResolvedValue(expansionRow());
    updateById.mockResolvedValue(expansionRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
    listByExpansionId.mockResolvedValue([]);
    existsByExpansionId.mockResolvedValue(false);
  });

  it('lists expansions and maps rows', async () => {
    listAll.mockResolvedValue([
      expansionRow(),
      expansionRow({
        id: 'expansion-2',
        name: '进行中',
        description: null,
        endDate: null,
      }),
    ]);

    await expect(listAdminGameExpansions()).resolves.toEqual({
      items: [
        {
          id: 'expansion-1',
          name: '江湖',
          description: '描述',
          level: 120,
          startDate: '2024-01-01',
          endDate: '2025-12-31',
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
        {
          id: 'expansion-2',
          name: '进行中',
          description: null,
          level: 120,
          startDate: '2024-01-01',
          endDate: null,
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('gets an expansion and throws when missing', async () => {
    findById.mockResolvedValueOnce(expansionRow());
    await expect(getAdminGameExpansion('expansion-1')).resolves.toMatchObject({
      id: 'expansion-1',
      name: '江湖',
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameExpansion('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameExpansion('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
      );
    }
  });

  it('creates an expansion and normalizes optional fields', async () => {
    const body: CreateGameExpansionBody = {
      name: ' 万灵山庄 ',
      level: 130,
      description: '  ',
      startDate: '2026-01-01',
    };

    await createAdminGameExpansion(body);

    expect(findByName).toHaveBeenCalledWith('万灵山庄');
    expect(create).toHaveBeenCalledWith({
      name: '万灵山庄',
      level: 130,
      description: null,
      startDate: '2026-01-01',
      endDate: null,
    });
  });

  it('stores a description and end date when provided', async () => {
    await createAdminGameExpansion({
      name: '万灵山庄',
      level: 130,
      description: ' 新资料片 ',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(create).toHaveBeenCalledWith({
      name: '万灵山庄',
      level: 130,
      description: '新资料片',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });

  it('rejects a duplicate name on create', async () => {
    findByName.mockResolvedValue(expansionRow());

    await expect(
      createAdminGameExpansion({
        name: '江湖',
        level: 120,
        startDate: '2024-01-01',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an invalid own date range on create', async () => {
    await expect(
      createAdminGameExpansion({
        name: '江湖',
        level: 120,
        startDate: '2025-01-01',
        endDate: '2024-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('updates fields and keeps the current name', async () => {
    findById.mockResolvedValue(expansionRow());
    findByName.mockResolvedValue(expansionRow());

    const body: UpdateGameExpansionBody = {
      name: ' 江湖 ',
      level: 130,
      description: null,
    };

    await updateAdminGameExpansion('expansion-1', body);

    expect(findByName).toHaveBeenCalledWith('江湖');
    expect(listByExpansionId).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('expansion-1', {
      name: '江湖',
      level: 130,
      description: null,
    });
  });

  it('updates only the start date using the existing end date', async () => {
    findById.mockResolvedValue(expansionRow());

    await updateAdminGameExpansion('expansion-1', { startDate: '2024-02-01' });

    expect(listByExpansionId).toHaveBeenCalledWith('expansion-1');
    expect(updateById).toHaveBeenCalledWith('expansion-1', {
      startDate: '2024-02-01',
    });
  });

  it('updates only the end date using the existing start date', async () => {
    findById.mockResolvedValue(expansionRow({ endDate: null }));

    await updateAdminGameExpansion('expansion-1', { endDate: '2026-01-01' });

    expect(updateById).toHaveBeenCalledWith('expansion-1', {
      endDate: '2026-01-01',
    });
  });

  it('clears the end date when seasons still fit', async () => {
    findById.mockResolvedValue(expansionRow());
    listByExpansionId.mockResolvedValue([
      seasonRow({ endDate: null, startDate: '2024-06-01' }),
    ]);

    await updateAdminGameExpansion('expansion-1', { endDate: null });

    expect(updateById).toHaveBeenCalledWith('expansion-1', { endDate: null });
  });

  it('rejects shrinking dates that would exclude a season', async () => {
    findById.mockResolvedValue(expansionRow());
    listByExpansionId.mockResolvedValue([seasonRow()]);

    await expect(
      updateAdminGameExpansion('expansion-1', { endDate: '2024-03-01' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_DATE_CONFLICTS_WITH_SEASONS,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects renaming to another expansion name', async () => {
    findById.mockResolvedValue(expansionRow());
    findByName.mockResolvedValue(expansionRow({ id: 'expansion-2' }));

    await expect(
      updateAdminGameExpansion('expansion-1', { name: '其他' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects an invalid own date range on update', async () => {
    findById.mockResolvedValue(expansionRow());

    await expect(
      updateAdminGameExpansion('expansion-1', { startDate: '2026-01-01' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_DATE_INVALID,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the expansion disappears during update', async () => {
    findById.mockResolvedValue(expansionRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameExpansion('expansion-1', { description: 'x' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    });
  });

  it('normalizes a blank description on update', async () => {
    findById.mockResolvedValue(expansionRow());

    await updateAdminGameExpansion('expansion-1', { description: '  ' });

    expect(updateById).toHaveBeenCalledWith('expansion-1', {
      description: null,
    });
  });

  it('deletes an expansion that has no seasons and is not referenced', async () => {
    findById.mockResolvedValue(expansionRow());

    await deleteAdminGameExpansion('expansion-1');

    expect(existsByExpansionId).toHaveBeenCalledWith('expansion-1');
    expect(isReferenced).toHaveBeenCalledWith('expansion-1');
    expect(deleteById).toHaveBeenCalledWith('expansion-1');
  });

  it('rejects deleting an expansion that still has seasons', async () => {
    findById.mockResolvedValue(expansionRow());
    existsByExpansionId.mockResolvedValue(true);

    await expect(deleteAdminGameExpansion('expansion-1')).rejects.toMatchObject(
      {
        code: ERROR_CODES.GAME_EXPANSION_HAS_SEASONS,
      },
    );
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a referenced expansion', async () => {
    findById.mockResolvedValue(expansionRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameExpansion('expansion-1')).rejects.toMatchObject(
      {
        code: ERROR_CODES.GAME_EXPANSION_IN_USE,
      },
    );
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing expansion', async () => {
    await expect(deleteAdminGameExpansion('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
