import { gameExpansionRepository } from '@api/infrastructure/repository/game-expansion-repository';
import { gameSeasonRepository } from '@api/infrastructure/repository/game-season-repository';
import type {
  CreateGameExpansionBody,
  GameExpansionDetail,
  ListGameExpansionsResponse,
  UpdateGameExpansionBody,
} from '@api/interface/schema/game-expansion-schema';
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
  row: Pick<GameSeasonRow, 'startDate' | 'endDate'>,
): DateRange => ({
  startDate: toDateOnly(row.startDate),
  endDate: row.endDate === null ? null : toDateOnly(row.endDate),
});

const toGameExpansionDetail = (row: GameExpansionRow): GameExpansionDetail => {
  const range = toExpansionDateRange(row);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    level: row.level,
    startDate: range.startDate,
    endDate: range.endDate,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
  };
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

const assertNameAvailable = async (name: string, excludeId?: string) => {
  const existing = await gameExpansionRepository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '资料片名称已存在',
      ERROR_CODES.GAME_EXPANSION_NAME_ALREADY_EXISTS,
    );
  }
};

const assertOwnDateRange = (startDate: string, endDate: string | null) => {
  if (!isOwnDateRangeValid(startDate, endDate)) {
    throw new BadRequestException(
      '起始日期不能晚于终止日期',
      ERROR_CODES.GAME_EXPANSION_DATE_INVALID,
    );
  }
};

const assertSeasonsFitRange = (seasons: GameSeasonRow[], range: DateRange) => {
  for (const season of seasons) {
    if (!isRangeWithinRange(toSeasonDateRange(season), range)) {
      throw new ConflictException(
        `无法更新资料片日期：赛季「${season.name}」超出范围`,
        ERROR_CODES.GAME_EXPANSION_DATE_CONFLICTS_WITH_SEASONS,
      );
    }
  }
};

export const listAdminGameExpansions =
  async (): Promise<ListGameExpansionsResponse> => {
    const rows = await gameExpansionRepository.listAll();
    return {
      items: rows.map(toGameExpansionDetail),
    };
  };

export const getAdminGameExpansion = async (
  id: string,
): Promise<GameExpansionDetail> => {
  const row = await findGameExpansionOrThrow(id);
  return toGameExpansionDetail(row);
};

export const createAdminGameExpansion = async (
  body: CreateGameExpansionBody,
): Promise<GameExpansionDetail> => {
  const name = body.name.trim();
  const startDate = body.startDate;
  const endDate = body.endDate ?? null;

  await assertNameAvailable(name);
  assertOwnDateRange(startDate, endDate);

  const created = await gameExpansionRepository.create({
    name,
    level: body.level,
    description: normalizeNullableText(body.description),
    startDate,
    endDate,
  });

  return toGameExpansionDetail(created);
};

export const updateAdminGameExpansion = async (
  id: string,
  body: UpdateGameExpansionBody,
): Promise<GameExpansionDetail> => {
  const existing = await findGameExpansionOrThrow(id);
  const values: Parameters<typeof gameExpansionRepository.updateById>[1] = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    await assertNameAvailable(name, id);
    values.name = name;
  }

  if (body.level !== undefined) {
    values.level = body.level;
  }

  if (body.description !== undefined) {
    values.description = normalizeNullableText(body.description);
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
    const seasons = await gameSeasonRepository.listByExpansionId(id);
    assertSeasonsFitRange(seasons, nextRange);
    if (body.startDate !== undefined) {
      values.startDate = body.startDate;
    }
    if (body.endDate !== undefined) {
      values.endDate = body.endDate;
    }
  }

  const updated = await gameExpansionRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException(
      '资料片不存在',
      ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    );
  }

  return toGameExpansionDetail(updated);
};

export const deleteAdminGameExpansion = async (id: string): Promise<void> => {
  await findGameExpansionOrThrow(id);

  const hasSeasons = await gameSeasonRepository.existsByExpansionId(id);
  if (hasSeasons) {
    throw new ConflictException(
      '资料片下仍有赛季，请先删除赛季',
      ERROR_CODES.GAME_EXPANSION_HAS_SEASONS,
    );
  }

  const inUse = await gameExpansionRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '资料片已被引用，无法删除',
      ERROR_CODES.GAME_EXPANSION_IN_USE,
    );
  }

  await gameExpansionRepository.deleteById(id);
};
