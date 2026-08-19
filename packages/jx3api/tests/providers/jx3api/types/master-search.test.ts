import { describe, expect, it } from 'bun:test';
import {
  type Jx3apiMasterSearchDataRaw,
  mapMasterSearchData,
} from '../../../../src/providers/jx3api/types/master-search';

describe('mapMasterSearchData', () => {
  it('maps slave servers onto the normalized field', () => {
    const raw: Jx3apiMasterSearchDataRaw = {
      id: '42',
      center: '电信',
      zone: '电信一区',
      name: '梦江南',
      event: 1,
      voice: { 开服: [8, 30] },
      alias: ['梦江'],
      slave: ['绝代天骄', '龙争虎斗'],
    };

    expect(mapMasterSearchData(raw)).toEqual({
      id: '42',
      center: '电信',
      zone: '电信一区',
      name: '梦江南',
      event: 1,
      voice: { 开服: [8, 30] },
      alias: ['梦江'],
      slaveServers: ['绝代天骄', '龙争虎斗'],
    });
  });
});
