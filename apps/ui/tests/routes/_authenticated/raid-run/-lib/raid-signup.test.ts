import { describe, expect, it } from 'vitest';
import {
  applyRaidSignupFromCharacterSearch,
  createRaidSignup,
  formatRaidSignupCharacterSearchLabel,
  formatRaidSignupSlotTitle,
  isRaidSignupSlotEmpty,
  kungfuTypeToRaidSignupRole,
  matchesRaidSignupCharacterQuery,
  RAID_SIGNUP_SLOT_DND_TYPE,
  raidSignupCharacterSearchSelectionFromItem,
  raidSignupRoleCellClassName,
  raidSignupRoleItems,
  raidSignupRoleMapping,
  raidSignupSlotId,
  resetRaidSignup,
  resolveRaidSignupSwapSlots,
  setRaidSignupCharacterName,
  setRaidSignupIsDarkRun,
  setRaidSignupIsFormationCore,
  setRaidSignupIsLeader,
  setRaidSignupKungfu,
  setRaidSignupKungfuId,
  setRaidSignupRemark,
  setRaidSignupRole,
  setRaidSignupSchoolId,
  setRaidSignupServerId,
  swapRaidSignupAttributes,
} from '@/routes/_authenticated/raid-run/-lib/raid-signup';

const baseSignup = () =>
  createRaidSignup({
    id: 'signup-1',
    groupNumber: 2,
    positionNumber: 3,
    role: 'tank',
    isLeader: true,
    isDarkRun: true,
    isFormationCore: true,
    serverId: 'server-1',
    characterName: '角色',
    schoolId: 'school-1',
    kungfuId: 'kungfu-1',
    remark: '备注',
  });

describe('raid-signup', () => {
  it('maps roles to Chinese labels', () => {
    expect(raidSignupRoleMapping.pending).toBe('待定');
    expect(raidSignupRoleMapping.boss).toBe('老板');
  });

  it('creates a signup with defaults when optional fields are omitted', () => {
    const signup = createRaidSignup({
      groupNumber: 1,
      positionNumber: 1,
    });

    expect(signup.id).toEqual(expect.any(String));
    expect(signup.role).toBe('pending');
    expect(signup.isLeader).toBe(false);
    expect(signup.isDarkRun).toBe(false);
    expect(signup.isFormationCore).toBe(false);
    expect(signup.serverId).toBeUndefined();
    expect(signup.characterName).toBeUndefined();
  });

  it('creates a signup from provided props', () => {
    const signup = baseSignup();

    expect(signup).toMatchObject({
      id: 'signup-1',
      groupNumber: 2,
      positionNumber: 3,
      role: 'tank',
      isLeader: true,
      characterName: '角色',
    });
  });

  it('returns new snapshots from field setters without mutating the original', () => {
    const signup = baseSignup();

    expect(setRaidSignupRole(signup, 'healer')).toEqual({
      ...signup,
      role: 'healer',
    });
    expect(setRaidSignupIsLeader(signup, false).isLeader).toBe(false);
    expect(setRaidSignupIsDarkRun(signup, false).isDarkRun).toBe(false);
    expect(setRaidSignupIsFormationCore(signup, false).isFormationCore).toBe(
      false,
    );
    expect(setRaidSignupServerId(signup, 'server-2').serverId).toBe('server-2');
    expect(setRaidSignupServerId(signup, undefined).serverId).toBeUndefined();
    expect(setRaidSignupCharacterName(signup, '新角色').characterName).toBe(
      '新角色',
    );
    expect(setRaidSignupSchoolId(signup, 'school-2').schoolId).toBe('school-2');
    expect(setRaidSignupKungfuId(signup, 'kungfu-2').kungfuId).toBe('kungfu-2');
    expect(
      setRaidSignupKungfu(signup, {
        id: 'kungfu-3',
        schoolId: 'school-3',
        kungfuType: 'heal',
      }),
    ).toEqual({
      ...signup,
      kungfuId: 'kungfu-3',
      schoolId: 'school-3',
      role: 'healer',
    });
    expect(setRaidSignupKungfu(signup, undefined)).toEqual({
      ...signup,
      kungfuId: undefined,
      schoolId: undefined,
    });
    expect(setRaidSignupRemark(signup, '新备注').remark).toBe('新备注');
    expect(signup.role).toBe('tank');
    expect(signup.characterName).toBe('角色');
  });

  it('resets mutable fields and keeps the slot identity', () => {
    const signup = baseSignup();
    const reset = resetRaidSignup(signup);

    expect(reset).toEqual({
      id: 'signup-1',
      groupNumber: 2,
      positionNumber: 3,
      role: 'pending',
      isLeader: false,
      isDarkRun: false,
      isFormationCore: false,
      serverId: undefined,
      characterName: undefined,
      schoolId: undefined,
      kungfuId: undefined,
      remark: undefined,
    });
    expect(signup.role).toBe('tank');
  });

  it('formats slot titles and empty-slot checks', () => {
    expect(formatRaidSignupSlotTitle(2, 3)).toBe('第2队第3位');
    expect(
      isRaidSignupSlotEmpty(
        createRaidSignup({ groupNumber: 1, positionNumber: 1 }),
      ),
    ).toBe(true);
    expect(isRaidSignupSlotEmpty(baseSignup())).toBe(false);
    expect(
      isRaidSignupSlotEmpty(
        createRaidSignup({
          groupNumber: 1,
          positionNumber: 1,
          characterName: '角色',
        }),
      ),
    ).toBe(false);
  });

  it('maps kungfu types to signup roles', () => {
    expect(kungfuTypeToRaidSignupRole('defense')).toBe('tank');
    expect(kungfuTypeToRaidSignupRole('heal')).toBe('healer');
    expect(kungfuTypeToRaidSignupRole('attack')).toBe('dps');
  });

  it('builds a character search selection from a search item', () => {
    expect(
      raidSignupCharacterSearchSelectionFromItem({
        characterName: '少侠甲',
        serverId: 'server-1',
        kungfuId: 'kungfu-1',
        schoolId: 'school-1',
        kungfuType: 'defense',
      }),
    ).toEqual({
      characterName: '少侠甲',
      serverId: 'server-1',
      kungfu: {
        id: 'kungfu-1',
        schoolId: 'school-1',
        kungfuType: 'defense',
      },
    });
    expect(
      raidSignupCharacterSearchSelectionFromItem({
        characterName: '少侠乙',
        serverId: null,
        kungfuId: null,
        schoolId: 'school-1',
        kungfuType: 'attack',
      }),
    ).toEqual({
      characterName: '少侠乙',
      serverId: undefined,
      kungfu: undefined,
    });
    expect(
      raidSignupCharacterSearchSelectionFromItem({
        characterName: '少侠丙',
        kungfuId: 'kungfu-1',
        schoolId: null,
        kungfuType: 'attack',
      }),
    ).toEqual({
      characterName: '少侠丙',
      serverId: undefined,
      kungfu: undefined,
    });
    expect(
      raidSignupCharacterSearchSelectionFromItem({
        characterName: '少侠丁',
        kungfuId: 'kungfu-1',
        schoolId: 'school-1',
        kungfuType: null,
      }),
    ).toEqual({
      characterName: '少侠丁',
      serverId: undefined,
      kungfu: undefined,
    });
  });

  it('applies a character search without clearing missing fields', () => {
    const signup = baseSignup();

    expect(
      applyRaidSignupFromCharacterSearch(signup, {
        characterName: '少侠甲',
        serverId: 'server-2',
        kungfu: {
          id: 'kungfu-3',
          schoolId: 'school-3',
          kungfuType: 'heal',
        },
      }),
    ).toEqual({
      ...signup,
      characterName: '少侠甲',
      serverId: 'server-2',
      kungfuId: 'kungfu-3',
      schoolId: 'school-3',
      role: 'healer',
    });
    expect(
      applyRaidSignupFromCharacterSearch(signup, {
        characterName: '新角色',
      }),
    ).toEqual({
      ...signup,
      characterName: '新角色',
    });
  });

  it('formats and matches character search labels', () => {
    expect(
      formatRaidSignupCharacterSearchLabel({
        characterName: '少侠甲',
        serverName: '梦江南',
        kungfuName: '紫霞功',
      }),
    ).toBe('少侠甲 · 梦江南 · 紫霞功');
    expect(
      formatRaidSignupCharacterSearchLabel({
        characterName: '少侠乙',
        serverName: null,
        kungfuName: '',
      }),
    ).toBe('少侠乙');

    const item = {
      characterName: '少侠甲',
      serverName: '梦江南',
      kungfuName: '紫霞功',
    };
    expect(matchesRaidSignupCharacterQuery(item, '  ')).toBe(true);
    expect(matchesRaidSignupCharacterQuery(item, '少侠')).toBe(true);
    expect(matchesRaidSignupCharacterQuery(item, '江南')).toBe(true);
    expect(matchesRaidSignupCharacterQuery(item, '紫霞')).toBe(true);
    expect(matchesRaidSignupCharacterQuery(item, '没有')).toBe(false);
    expect(
      matchesRaidSignupCharacterQuery(
        { characterName: '甲', serverName: null, kungfuName: null },
        '江南',
      ),
    ).toBe(false);
  });

  it('maps roles to cell colors and select items', () => {
    expect(raidSignupRoleCellClassName('tank')).toContain('bg-red-200');
    expect(raidSignupRoleCellClassName('healer')).toContain('bg-green-200');
    expect(raidSignupRoleCellClassName('dps')).toContain('bg-blue-200');
    expect(raidSignupRoleCellClassName('boss')).toContain('bg-amber-200');
    expect(raidSignupRoleCellClassName('pending')).toContain('bg-muted');
    expect(raidSignupRoleItems).toEqual(
      expect.arrayContaining([
        { value: 'pending', label: '待定' },
        { value: 'tank', label: '坦克' },
      ]),
    );
  });

  it('swaps mutable attributes and keeps slot identity', () => {
    const source = baseSignup();
    const target = createRaidSignup({
      id: 'signup-2',
      groupNumber: 4,
      positionNumber: 1,
      role: 'healer',
      characterName: '乙',
    });
    const [nextSource, nextTarget] = swapRaidSignupAttributes(source, target);

    expect(nextSource).toEqual({
      ...target,
      id: 'signup-1',
      groupNumber: 2,
      positionNumber: 3,
    });
    expect(nextTarget).toEqual({
      ...source,
      id: 'signup-2',
      groupNumber: 4,
      positionNumber: 1,
    });
    expect(source.characterName).toBe('角色');
    expect(target.characterName).toBe('乙');
  });

  it('resolves swap slots from drag identifiers', () => {
    expect(RAID_SIGNUP_SLOT_DND_TYPE).toBe('raid-signup-slot');
    expect(raidSignupSlotId(1, 2)).toBe('1:2');
    expect(resolveRaidSignupSwapSlots('1:1', '2:3')).toEqual({
      source: { groupNumber: 1, positionNumber: 1 },
      target: { groupNumber: 2, positionNumber: 3 },
    });
    expect(resolveRaidSignupSwapSlots('1:1', '1:1')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots(undefined, '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('1:1', undefined)).toBeUndefined();
    expect(resolveRaidSignupSwapSlots(11, '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('1:', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots(':1', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('abc:1', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('1:abc', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('0:1', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('1:0', '2:3')).toBeUndefined();
    expect(resolveRaidSignupSwapSlots('1.5:1', '2:3')).toBeUndefined();
  });
});
