import { describe, expect, it } from 'vitest';
import { gameServerFormSchema } from '@/routes/_authenticated/admin/game-servers/-lib/game-servers-form-schema';

describe('gameServerFormSchema', () => {
  it('trims server id, zone, and name', () => {
    expect(
      gameServerFormSchema.parse({
        serverId: ' mengjiangnan ',
        zone: ' 电信一区 ',
        name: ' 梦江南 ',
        aliasText: '梦岛',
      }),
    ).toEqual({
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
      aliasText: '梦岛',
    });
  });

  it('rejects blank required fields', () => {
    const result = gameServerFormSchema.safeParse({
      serverId: '  ',
      zone: '  ',
      name: '  ',
      aliasText: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an overly long alias', () => {
    const result = gameServerFormSchema.safeParse({
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
      aliasText: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
