import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameSeasonBody,
  UpdateGameSeasonBody,
} from '@api/interface/schema/game-season-schema';
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
  description: null,
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
  description: '赛季描述',
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  sortOrder: 1,
  createdAt,
  updatedAt,
  ...overrides,
});

const expansionFindById = mock<
  (id: string) => Promise<GameExpansionRow | null>
>(() => Promise.resolve(null));
const listByExpansionId = mock<(id: string) => Promise<GameSeasonRow[]>>(() =>
  Promise.resolve([]),
);
const findById = mock<(id: string) => Promise<GameSeasonRow | null>>(() =>
  Promise.resolve(null),
);
const findByExpansionIdAndName = mock<
  (expansionId: string, name: string) => Promise<GameSeasonRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<GameSeasonRow>>(() =>
  Promise.resolve(seasonRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameSeasonRow | null>
>(() => Promise.resolve(seasonRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/game-expansion-repository', () => ({
  gameExpansionRepository: {
    findById: expansionFindById,
  },
}));

mock.module('@api/infrastructure/repository/game-season-repository', () => ({
  gameSeasonRepository: {
    listByExpansionId,
    findById,
    findByExpansionIdAndName,
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
  listAdminGameSeasons,
  getAdminGameSeason,
  createAdminGameSeason,
  updateAdminGameSeason,
  deleteAdminGameSeason,
} = await import('@api/application/service/game-season-service');

describe('game-season-service', () => {
  beforeEach(() => {
    expansionFindById.mockReset();
    listByExpansionId.mockReset();
    findById.mockReset();
    findByExpansionIdAndName.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    formatDateTime.mockClear();

    expansionFindById.mockResolvedValue(expansionRow());
    listByExpansionId.mockResolvedValue([]);
    findById.mockResolvedValue(null);
    findByExpansionIdAndName.mockResolvedValue(null);
    create.mockResolvedValue(seasonRow());
    updateById.mockResolvedValue(seasonRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
  });

  it('lists seasons for an expansion and maps rows', async () => {
    listByExpansionId.mockResolvedValue([
      seasonRow(),
      seasonRow({
        id: 'season-2',
        name: 'S2',
        description: null,
        endDate: null,
        sortOrder: 2,
      }),
    ]);

    await expect(
      listAdminGameSeasons({ expansionId: 'expansion-1' }),
    ).resolves.toEqual({
      items: [
        {
          id: 'season-1',
          expansionId: 'expansion-1',
          name: 'S1',
          description: '赛季描述',
          startDate: '2024-06-01',
          endDate: '2024-12-31',
          sortOrder: 1,
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
        {
          id: 'season-2',
          expansionId: 'expansion-1',
          name: 'S2',
          description: null,
          startDate: '2024-06-01',
          endDate: null,
          sortOrder: 2,
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('rejects listing seasons for a missing expansion', async () => {
    expansionFindById.mockResolvedValue(null);

    await expect(
      listAdminGameSeasons({ expansionId: 'missing' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    });
    expect(listByExpansionId).not.toHaveBeenCalled();
  });

  it('gets a season and throws when missing', async () => {
    findById.mockResolvedValueOnce(seasonRow());
    await expect(getAdminGameSeason('season-1')).resolves.toMatchObject({
      id: 'season-1',
      name: 'S1',
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameSeason('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameSeason('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_SEASON_NOT_FOUND,
      );
    }
  });

  it('creates a season with defaults and normalized fields', async () => {
    const body: CreateGameSeasonBody = {
      expansionId: 'expansion-1',
      name: ' S2 ',
      description: '  ',
      startDate: '2024-07-01',
      endDate: '2024-12-01',
    };

    await createAdminGameSeason(body);

    expect(findByExpansionIdAndName).toHaveBeenCalledWith('expansion-1', 'S2');
    expect(create).toHaveBeenCalledWith({
      expansionId: 'expansion-1',
      name: 'S2',
      description: null,
      startDate: '2024-07-01',
      endDate: '2024-12-01',
      sortOrder: 0,
    });
  });

  it('stores description, end date, and sort order when provided', async () => {
    await createAdminGameSeason({
      expansionId: 'expansion-1',
      name: 'S2',
      description: ' 下一赛季 ',
      startDate: '2024-07-01',
      endDate: '2024-12-01',
      sortOrder: 3,
    });

    expect(create).toHaveBeenCalledWith({
      expansionId: 'expansion-1',
      name: 'S2',
      description: '下一赛季',
      startDate: '2024-07-01',
      endDate: '2024-12-01',
      sortOrder: 3,
    });
  });

  it('rejects a duplicate name on create', async () => {
    findByExpansionIdAndName.mockResolvedValue(seasonRow());

    await expect(
      createAdminGameSeason({
        expansionId: 'expansion-1',
        name: 'S1',
        startDate: '2024-07-01',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an invalid own date range on create', async () => {
    await expect(
      createAdminGameSeason({
        expansionId: 'expansion-1',
        name: 'S2',
        startDate: '2024-12-01',
        endDate: '2024-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a season that falls outside the expansion', async () => {
    await expect(
      createAdminGameSeason({
        expansionId: 'expansion-1',
        name: 'S2',
        startDate: '2023-01-01',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_DATE_OUTSIDE_EXPANSION,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an open-ended season under a closed expansion', async () => {
    await expect(
      createAdminGameSeason({
        expansionId: 'expansion-1',
        name: 'S2',
        startDate: '2024-06-01',
        endDate: null,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_DATE_OUTSIDE_EXPANSION,
    });
  });

  it('allows an open-ended season under an open expansion', async () => {
    expansionFindById.mockResolvedValue(expansionRow({ endDate: null }));

    await createAdminGameSeason({
      expansionId: 'expansion-1',
      name: 'S2',
      startDate: '2024-06-01',
    });

    expect(create).toHaveBeenCalled();
  });

  it('updates fields without touching dates', async () => {
    findById.mockResolvedValue(seasonRow());
    findByExpansionIdAndName.mockResolvedValue(seasonRow());

    const body: UpdateGameSeasonBody = {
      name: ' S1 ',
      description: null,
      sortOrder: 5,
    };

    await updateAdminGameSeason('season-1', body);

    expect(findByExpansionIdAndName).toHaveBeenCalledWith('expansion-1', 'S1');
    expect(updateById).toHaveBeenCalledWith('season-1', {
      name: 'S1',
      description: null,
      sortOrder: 5,
    });
  });

  it('updates only the start date using the existing end date', async () => {
    findById.mockResolvedValue(seasonRow());

    await updateAdminGameSeason('season-1', { startDate: '2024-07-01' });

    expect(updateById).toHaveBeenCalledWith('season-1', {
      startDate: '2024-07-01',
    });
  });

  it('updates only the end date using the existing start date', async () => {
    findById.mockResolvedValue(seasonRow({ endDate: null }));
    expansionFindById.mockResolvedValue(expansionRow({ endDate: null }));

    await updateAdminGameSeason('season-1', { endDate: '2024-08-01' });

    expect(updateById).toHaveBeenCalledWith('season-1', {
      endDate: '2024-08-01',
    });
  });

  it('clears the end date when the expansion is open', async () => {
    findById.mockResolvedValue(seasonRow());
    expansionFindById.mockResolvedValue(expansionRow({ endDate: null }));

    await updateAdminGameSeason('season-1', { endDate: null });

    expect(updateById).toHaveBeenCalledWith('season-1', { endDate: null });
  });

  it('rejects renaming to another season name in the same expansion', async () => {
    findById.mockResolvedValue(seasonRow());
    findByExpansionIdAndName.mockResolvedValue(
      seasonRow({ id: 'season-2', name: 'S2' }),
    );

    await expect(
      updateAdminGameSeason('season-1', { name: 'S2' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects an invalid own date range on update', async () => {
    findById.mockResolvedValue(seasonRow());

    await expect(
      updateAdminGameSeason('season-1', { startDate: '2025-01-01' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_DATE_INVALID,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects dates outside the expansion on update', async () => {
    findById.mockResolvedValue(seasonRow());

    await expect(
      updateAdminGameSeason('season-1', { startDate: '2023-01-01' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_DATE_OUTSIDE_EXPANSION,
    });
  });

  it('throws when the season disappears during update', async () => {
    findById.mockResolvedValue(seasonRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameSeason('season-1', { description: 'x' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_NOT_FOUND,
    });
  });

  it('normalizes a blank description on update', async () => {
    findById.mockResolvedValue(seasonRow());

    await updateAdminGameSeason('season-1', { description: '  ' });

    expect(updateById).toHaveBeenCalledWith('season-1', {
      description: null,
    });
  });

  it('deletes a season that is not referenced', async () => {
    findById.mockResolvedValue(seasonRow());

    await deleteAdminGameSeason('season-1');

    expect(isReferenced).toHaveBeenCalledWith('season-1');
    expect(deleteById).toHaveBeenCalledWith('season-1');
  });

  it('rejects deleting a referenced season', async () => {
    findById.mockResolvedValue(seasonRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameSeason('season-1')).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing season', async () => {
    await expect(deleteAdminGameSeason('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
