import { describe, expect, it } from 'bun:test';
import {
  isServerStatusCheckList,
  type Jx3apiMasterSearchDataRaw,
  mapMasterSearchData,
} from '../../../../src/providers/jx3api/types/master-search';

const raw: Jx3apiMasterSearchDataRaw = {
  server: '梦江南',
  lasttime: 1_786_935_237,
  shuttime: 1_786_919_757,
  status: 1,
  zone: '电信区',
};

describe('isServerStatusCheckList', () => {
  it('accepts a list of status items', () => {
    expect(isServerStatusCheckList([raw])).toBe(true);
  });

  it('rejects an empty object miss payload', () => {
    expect(isServerStatusCheckList({})).toBe(false);
  });
});

describe('mapMasterSearchData', () => {
  it('maps snake_case timestamps and server onto the normalized fields', () => {
    expect(mapMasterSearchData(raw)).toEqual({
      zone: '电信区',
      name: '梦江南',
      status: 1,
      lastTime: 1_786_935_237,
      shutTime: 1_786_919_757,
    });
  });
});
