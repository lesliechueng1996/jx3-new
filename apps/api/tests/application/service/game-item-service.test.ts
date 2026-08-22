import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameItemBody,
  ListGameItemsQuery,
  UpdateGameItemBody,
} from '@api/interface/schema/game-item-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type GameItemRow = {
  id: string;
  name: string;
  gameItemId: string | null;
  type: 'equipment' | 'special' | 'small_iron' | 'enchantment';
  quality: 'white' | 'green' | 'blue' | 'purple' | 'orange';
  description: string | null;
  icon: string | null;
  alias: string[];
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const itemRow = (overrides: Partial<GameItemRow> = {}): GameItemRow => ({
  id: 'item-1',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special',
  quality: 'orange',
  description: '用于装备精炼',
  icon: '/icons/xuanjing.png',
  alias: ['大铁'],
  createdAt,
  updatedAt,
  ...overrides,
});

const buildWhereClause = mock<(query: ListGameItemsQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<GameItemRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<GameItemRow | null>>(() =>
  Promise.resolve(null),
);
const findByName = mock<(name: string) => Promise<GameItemRow | null>>(() =>
  Promise.resolve(null),
);
const findByGameItemId = mock<
  (gameItemId: string) => Promise<GameItemRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<GameItemRow>>(() =>
  Promise.resolve(itemRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameItemRow | null>
>(() => Promise.resolve(itemRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/game-item-repository', () => ({
  gameItemRepository: {
    buildWhereClause,
    listPagination,
    count,
    findById,
    findByName,
    findByGameItemId,
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
  listAdminGameItems,
  getAdminGameItem,
  createAdminGameItem,
  updateAdminGameItem,
  deleteAdminGameItem,
} = await import('@api/application/service/game-item-service');

const listQuery = (
  overrides: Partial<ListGameItemsQuery> = {},
): ListGameItemsQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('game-item-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findByName.mockReset();
    findByGameItemId.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    formatDateTime.mockClear();

    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findByName.mockResolvedValue(null);
    findByGameItemId.mockResolvedValue(null);
    create.mockResolvedValue(itemRow());
    updateById.mockResolvedValue(itemRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
  });

  it('lists items and maps rows', async () => {
    listPagination.mockResolvedValue([itemRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminGameItems(
      listQuery({
        name: '玄',
        type: 'special',
        quality: 'orange',
        missingIcon: true,
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'item-1',
          name: '上品玄晶',
          gameItemId: '12345',
          type: 'special',
          quality: 'orange',
          description: '用于装备精炼',
          icon: '/icons/xuanjing.png',
          alias: ['大铁'],
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

    const result = await listAdminGameItems(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets an item and throws when missing', async () => {
    findById.mockResolvedValueOnce(
      itemRow({ type: 'equipment', quality: 'white', icon: null }),
    );
    await expect(getAdminGameItem('item-1')).resolves.toMatchObject({
      id: 'item-1',
      type: 'equipment',
      quality: 'white',
      icon: null,
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameItem('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameItem('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_ITEM_NOT_FOUND,
      );
    }
  });

  it('creates an item and normalizes optional fields', async () => {
    const body: CreateGameItemBody = {
      name: ' 小铁 ',
      gameItemId: '  888  ',
      type: 'small_iron',
      quality: 'purple',
      description: '  精炼材料  ',
      icon: '  /icons/iron.png  ',
      alias: [' 铁 ', '', '铁', '小铁'],
    };

    await createAdminGameItem(body);

    expect(findByName).toHaveBeenCalledWith('小铁');
    expect(findByGameItemId).toHaveBeenCalledWith('888');
    expect(create).toHaveBeenCalledWith({
      name: '小铁',
      gameItemId: '888',
      type: 'small_iron',
      quality: 'purple',
      description: '精炼材料',
      icon: '/icons/iron.png',
      alias: ['铁', '小铁'],
    });
  });

  it('stores null optional fields when omitted', async () => {
    await createAdminGameItem({
      name: '附魔',
      type: 'enchantment',
      quality: 'blue',
    });

    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      name: '附魔',
      gameItemId: null,
      type: 'enchantment',
      quality: 'blue',
      description: null,
      icon: null,
      alias: [],
    });
  });

  it('stores null optional fields when create receives blank or null', async () => {
    await createAdminGameItem({
      name: '白装',
      type: 'equipment',
      quality: 'white',
      gameItemId: '   ',
      description: '   ',
      icon: '   ',
    });
    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      gameItemId: null,
      description: null,
      icon: null,
    });

    await createAdminGameItem({
      name: '绿装',
      type: 'equipment',
      quality: 'green',
      gameItemId: null,
      description: null,
      icon: null,
    });
    expect(create.mock.calls[1]?.[0]).toMatchObject({
      gameItemId: null,
      description: null,
      icon: null,
    });
  });

  it('rejects a duplicate name on create', async () => {
    findByName.mockResolvedValue(itemRow());

    await expect(
      createAdminGameItem({
        name: '上品玄晶',
        type: 'special',
        quality: 'orange',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate game item id on create', async () => {
    findByGameItemId.mockResolvedValue(itemRow());

    await expect(
      createAdminGameItem({
        name: '新品',
        gameItemId: '12345',
        type: 'special',
        quality: 'orange',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates an item including uniqueness against others', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(null);
    findByGameItemId.mockResolvedValue(null);

    const body: UpdateGameItemBody = {
      name: ' 上品玄晶·改 ',
      gameItemId: '999',
      type: 'equipment',
      quality: 'purple',
      description: '新描述',
      icon: 'icon.png',
      alias: ['玄晶'],
    };

    await updateAdminGameItem('item-1', body);

    expect(findByName).toHaveBeenCalledWith('上品玄晶·改');
    expect(findByGameItemId).toHaveBeenCalledWith('999');
    expect(updateById).toHaveBeenCalledWith('item-1', {
      name: '上品玄晶·改',
      gameItemId: '999',
      type: 'equipment',
      quality: 'purple',
      description: '新描述',
      icon: 'icon.png',
      alias: ['玄晶'],
    });
  });

  it('allows keeping the current name and game item id on update', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(itemRow());
    findByGameItemId.mockResolvedValue(itemRow());

    await updateAdminGameItem('item-1', {
      name: '上品玄晶',
      gameItemId: '12345',
    });

    expect(updateById).toHaveBeenCalledWith('item-1', {
      name: '上品玄晶',
      gameItemId: '12345',
    });
  });

  it('rejects renaming to another item name', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(itemRow({ id: 'item-2', name: '小铁' }));

    await expect(
      updateAdminGameItem('item-1', { name: '小铁' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects changing to another game item id', async () => {
    findById.mockResolvedValue(itemRow());
    findByGameItemId.mockResolvedValue(
      itemRow({ id: 'item-2', gameItemId: '999' }),
    );

    await expect(
      updateAdminGameItem('item-1', { gameItemId: '999' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the item disappears during update', async () => {
    findById.mockResolvedValue(itemRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameItem('item-1', { type: 'enchantment' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NOT_FOUND,
    });
  });

  it('clears optional fields on update', async () => {
    findById.mockResolvedValue(itemRow());

    await updateAdminGameItem('item-1', {
      gameItemId: null,
      description: '  ',
      icon: null,
      alias: ['  ', ''],
    });

    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('item-1', {
      gameItemId: null,
      description: null,
      icon: null,
      alias: [],
    });
  });

  it('deletes an item that is not referenced', async () => {
    findById.mockResolvedValue(itemRow());

    await deleteAdminGameItem('item-1');

    expect(isReferenced).toHaveBeenCalledWith('item-1');
    expect(deleteById).toHaveBeenCalledWith('item-1');
  });

  it('rejects deleting a referenced item', async () => {
    findById.mockResolvedValue(itemRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameItem('item-1')).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing item', async () => {
    await expect(deleteAdminGameItem('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
