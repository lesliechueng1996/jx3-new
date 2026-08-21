import { gameExpansionRepository } from '@api/infrastructure/repository/game-expansion-repository';
import { gameSeasonRepository } from '@api/infrastructure/repository/game-season-repository';
import type {
  CreateGameSeasonBody,
  GameSeasonDetail,
  ListGameSeasonsQuery,
  ListGameSeasonsResponse,
  UpdateGameSeasonBody,
} from '@api/interface/schema/game-season-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import {
  type DateRange,
  isOwnDateRangeValid,
  isRangeWithinRange,
  toDateOnly,
} from '@api/shared/util/date-range';

type GameExpansionRow = NonNullable<
  Awaited<ReturnType<typeof gameExpansionRepository.findById>>
>;

type GameSeasonRow = NonNullable<
  Awaited<ReturnType<typeof gameSeasonRepository.findById>>
>;

const normalizeNullableText = (
  value: string | null | undefined,
): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toExpansionDateRange = (
  row: Pick<GameExpansionRow, 'startDate' | 'endDate'>,
): DateRange => ({
  startDate: toDateOnly(row.startDate),
  endDate: row.endDate === null ? null : toDateOnly(row.endDate),
});

const toSeasonDateRange = (
  startDate: string | Date,
  endDate: string | Date | null,
): DateRange => ({
  startDate: toDateOnly(startDate),
  endDate: endDate === null ? null : toDateOnly(endDate),
});

const toGameSeasonDetail = (row: GameSeasonRow): GameSeasonDetail => {
  const range = toSeasonDateRange(row.startDate, row.endDate);
  return {
    id: row.id,
    expansionId: row.expansionId,
    name: row.name,
    description: row.description,
    startDate: range.startDate,
    endDate: range.endDate,
    sortOrder: row.sortOrder,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  };
};

const findGameSeasonOrThrow = async (id: string): Promise<GameSeasonRow> => {
  const row = await gameSeasonRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '赛季不存在',
      ERROR_CODES.GAME_SEASON_NOT_FOUND,
    );
  }
  return row;
};

const findGameExpansionOrThrow = async (
  id: string,
): Promise<GameExpansionRow> => {
  const row = await gameExpansionRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '资料片不存在',
      ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    );
  }
  return row;
};

const assertNameAvailable = async (
  expansionId: string,
  name: string,
  excludeId?: string,
) => {
  const existing = await gameSeasonRepository.findByExpansionIdAndName(
    expansionId,
    name,
  );
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '该资料片下赛季名称已存在',
      ERROR_CODES.GAME_SEASON_NAME_ALREADY_EXISTS,
    );
  }
};

const assertOwnDateRange = (startDate: string, endDate: string | null) => {
  if (!isOwnDateRangeValid(startDate, endDate)) {
    throw new BadRequestException(
      '起始日期不能晚于终止日期',
      ERROR_CODES.GAME_SEASON_DATE_INVALID,
    );
  }
};

const assertSeasonFitsExpansion = (
  seasonRange: DateRange,
  expansionRange: DateRange,
) => {
  if (!isRangeWithinRange(seasonRange, expansionRange)) {
    throw new BadRequestException(
      '赛季日期必须落在所属资料片的日期范围内',
      ERROR_CODES.GAME_SEASON_DATE_OUTSIDE_EXPANSION,
    );
  }
};

export const listAdminGameSeasons = async (
  query: ListGameSeasonsQuery,
): Promise<ListGameSeasonsResponse> => {
  await findGameExpansionOrThrow(query.expansionId);
  const rows = await gameSeasonRepository.listByExpansionId(query.expansionId);
  return {
    items: rows.map(toGameSeasonDetail),
  };
};

export const getAdminGameSeason = async (
  id: string,
): Promise<GameSeasonDetail> => {
  const row = await findGameSeasonOrThrow(id);
  return toGameSeasonDetail(row);
};

export const createAdminGameSeason = async (
  body: CreateGameSeasonBody,
): Promise<GameSeasonDetail> => {
  const expansion = await findGameExpansionOrThrow(body.expansionId);
  const name = body.name.trim();
  const startDate = body.startDate;
  const endDate = body.endDate ?? null;
  const sortOrder = body.sortOrder ?? 0;

  await assertNameAvailable(body.expansionId, name);
  assertOwnDateRange(startDate, endDate);
  assertSeasonFitsExpansion(
    { startDate, endDate },
    toExpansionDateRange(expansion),
  );

  const created = await gameSeasonRepository.create({
    expansionId: body.expansionId,
    name,
    description: normalizeNullableText(body.description),
    startDate,
    endDate,
    sortOrder,
  });

  return toGameSeasonDetail(created);
};

export const updateAdminGameSeason = async (
  id: string,
  body: UpdateGameSeasonBody,
): Promise<GameSeasonDetail> => {
  const existing = await findGameSeasonOrThrow(id);
  const expansion = await findGameExpansionOrThrow(existing.expansionId);
  const values: Parameters<typeof gameSeasonRepository.updateById>[1] = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    await assertNameAvailable(existing.expansionId, name, id);
    values.name = name;
  }

  if (body.description !== undefined) {
    values.description = normalizeNullableText(body.description);
  }

  if (body.sortOrder !== undefined) {
    values.sortOrder = body.sortOrder;
  }

  const nextRange: DateRange = {
    startDate:
      body.startDate !== undefined
        ? body.startDate
        : toDateOnly(existing.startDate),
    endDate:
      body.endDate !== undefined
        ? body.endDate
        : existing.endDate === null
          ? null
          : toDateOnly(existing.endDate),
  };

  if (body.startDate !== undefined || body.endDate !== undefined) {
    assertOwnDateRange(nextRange.startDate, nextRange.endDate);
    assertSeasonFitsExpansion(nextRange, toExpansionDateRange(expansion));
    if (body.startDate !== undefined) {
      values.startDate = body.startDate;
    }
    if (body.endDate !== undefined) {
      values.endDate = body.endDate;
    }
  }

  const updated = await gameSeasonRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException(
      '赛季不存在',
      ERROR_CODES.GAME_SEASON_NOT_FOUND,
    );
  }

  return toGameSeasonDetail(updated);
};

export const deleteAdminGameSeason = async (id: string): Promise<void> => {
  await findGameSeasonOrThrow(id);

  const inUse = await gameSeasonRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '赛季已被引用，无法删除',
      ERROR_CODES.GAME_SEASON_IN_USE,
    );
  }

  await gameSeasonRepository.deleteById(id);
};
