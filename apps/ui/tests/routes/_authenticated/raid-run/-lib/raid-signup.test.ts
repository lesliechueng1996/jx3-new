import { describe, expect, it } from 'vitest';
import {
  createRaidSignup,
  raidSignupRoleMapping,
  resetRaidSignup,
  setRaidSignupCharacterName,
  setRaidSignupIsDarkRun,
  setRaidSignupIsFormationCore,
  setRaidSignupIsLeader,
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
    expect(setRaidSignupCharacterName(signup, '新角色').characterName).toBe(
      '新角色',
    );
    expect(setRaidSignupSchoolId(signup, 'school-2').schoolId).toBe('school-2');
    expect(setRaidSignupKungfuId(signup, 'kungfu-2').kungfuId).toBe('kungfu-2');
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
});
