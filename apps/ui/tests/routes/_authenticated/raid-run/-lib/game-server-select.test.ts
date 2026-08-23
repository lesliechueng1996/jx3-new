import { describe, expect, it } from 'vitest';
import {
  formatGameServerLabel,
  gameServerInputLabel,
  matchesGameServerQuery,
  resolveGameServerInput,
} from '@/routes/_authenticated/raid-run/-lib/game-server-select';

const server = {
  id: 'server-1',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛', 'Meng Jiangnan'],
};

describe('formatGameServerLabel', () => {
  it('joins zone and name', () => {
    expect(formatGameServerLabel(server)).toBe('电信一区 · 梦江南');
  });
});

describe('matchesGameServerQuery', () => {
  it('matches an empty query', () => {
    expect(matchesGameServerQuery(server, '  ')).toBe(true);
  });

  it('matches name, zone, label, and alias', () => {
    expect(matchesGameServerQuery(server, '梦江')).toBe(true);
    expect(matchesGameServerQuery(server, '电信')).toBe(true);
    expect(matchesGameServerQuery(server, '电信一区 · 梦江南')).toBe(true);
    expect(matchesGameServerQuery(server, 'meng jiang')).toBe(true);
    expect(matchesGameServerQuery(server, '梦岛')).toBe(true);
    expect(matchesGameServerQuery(server, '绝代')).toBe(false);
  });
});

describe('gameServerInputLabel', () => {
  it('resolves a selected server label', () => {
    expect(gameServerInputLabel('server-1', [server])).toBe(
      '电信一区 · 梦江南',
    );
    expect(gameServerInputLabel('missing', [server])).toBe('');
    expect(gameServerInputLabel(undefined, [server])).toBe('');
  });
});

describe('resolveGameServerInput', () => {
  const servers = [
    server,
    {
      id: 'server-2',
      zone: '双线一区',
      name: '绝代天骄',
      alias: [],
    },
  ];

  it('clears empty input', () => {
    expect(resolveGameServerInput('  ', servers)).toEqual({ action: 'clear' });
  });

  it('selects an exact label, name, or alias', () => {
    expect(resolveGameServerInput('绝代天骄', servers)).toEqual({
      action: 'select',
      serverId: 'server-2',
    });
    expect(resolveGameServerInput('电信一区 · 梦江南', servers)).toEqual({
      action: 'select',
      serverId: 'server-1',
    });
    expect(resolveGameServerInput('梦岛', servers)).toEqual({
      action: 'select',
      serverId: 'server-1',
    });
  });

  it('reverts unmatched input', () => {
    expect(resolveGameServerInput('少林', servers)).toEqual({
      action: 'revert',
    });
  });
});
