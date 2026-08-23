import { describe, expect, it } from 'vitest';
import {
  createRaidSignup,
  formatRaidSignupSlotTitle,
  isRaidSignupSlotEmpty,
  kungfuTypeToRaidSignupRole,
  raidSignupRoleCellClassName,
  raidSignupRoleItems,
  raidSignupRoleMapping,
  resetRaidSignup,
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
});
